import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import {
  type SyncOperation,
  type OperationAcknowledgement,
  type ConflictRecord,
  type ConflictResolutionPayload,
  type WorkspaceSnapshot,
  type TaskEntity,
  type VersionVector,
  type OperationType,
  isIdenticalOperation,
  evaluateCausality,
  validateDependencyAddition,
  isGraphGloballyAcyclic
} from '@nexussync/shared';
import { getDb } from './database.js';

export interface BatchIngestResult {
  acks: OperationAcknowledgement[];
  committedOps: SyncOperation[];
  detectedConflicts: ConflictRecord[];
}

export class OperationsRepository {
  private db: DatabaseSync;

  constructor(db: DatabaseSync = getDb()) {
    this.db = db;
  }

  /**
   * Helper to execute a function inside an immediate SQLite transaction.
   */
  public runTransaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK');
      } catch {
        // Suppress secondary rollback errors
      }
      throw err;
    }
  }

  /**
   * Retrieves the current highest server sequence for a project.
   */
  public getHighestServerSeq(projectId: string): number {
    const row = this.db
      .prepare('SELECT last_server_seq FROM project_sequences WHERE project_id = ?')
      .get(projectId) as { last_server_seq: number } | undefined;

    if (row) {
      return row.last_server_seq;
    }

    const opRow = this.db
      .prepare('SELECT COALESCE(MAX(server_seq), 0) AS max_seq FROM operations WHERE project_id = ?')
      .get(projectId) as { max_seq: number } | undefined;

    return opRow ? opRow.max_seq : 0;
  }

  /**
   * Fetches an operation by its unique opId.
   */
  public getOperationByOpId(opId: string): SyncOperation | null {
    const row = this.db
      .prepare('SELECT * FROM operations WHERE op_id = ?')
      .get(opId) as Record<string, unknown> | undefined;

    if (!row) return null;
    return this.mapRowToOperation(row);
  }

  /**
   * Fetches missed operations for a project with server_seq > afterSeq.
   * Results are strictly ordered by server_seq ASC and bounded by limit.
   */
  public getOperationsAfterSeq(projectId: string, afterSeq: number, limit = 100): SyncOperation[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM operations 
         WHERE project_id = ? AND server_seq > ? 
         ORDER BY server_seq ASC 
         LIMIT ?`
      )
      .all(projectId, afterSeq, limit) as Record<string, unknown>[];

    return rows.map((r) => this.mapRowToOperation(r));
  }

  /**
   * Calculates the current known version vector for a project by aggregating replica client sequences.
   */
  public getProjectVersionVector(projectId: string): VersionVector {
    const rows = this.db
      .prepare(
        `SELECT replica_id, MAX(client_seq) AS max_client_seq 
         FROM operations 
         WHERE project_id = ? 
         GROUP BY replica_id`
      )
      .all(projectId) as { replica_id: string; max_client_seq: number }[];

    const vector: VersionVector = {};
    for (const row of rows) {
      vector[row.replica_id] = row.max_client_seq;
    }
    return vector;
  }

  /**
   * Retrieves active unresolved conflicts for a project.
   */
  public getUnresolvedConflicts(projectId: string): ConflictRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM conflicts WHERE project_id = ? AND status = 'UNRESOLVED'")
      .all(projectId) as Record<string, unknown>[];

    return rows.map((r) => this.mapRowToConflict(r));
  }

  /**
   * Fetches a conflict by conflictId.
   */
  public getConflictById(conflictId: string): ConflictRecord | null {
    const row = this.db
      .prepare('SELECT * FROM conflicts WHERE conflict_id = ?')
      .get(conflictId) as Record<string, unknown> | undefined;

    if (!row) return null;
    return this.mapRowToConflict(row);
  }

  /**
   * Ingests a batch of operations transactionally.
   * Enforces:
   * 1. Monotonic sequence allocation per project
   * 2. Idempotency on opId and rejection of conflicting opId reuse
   * 3. Task dependency DAG cycle prevention on DEPENDENCY_ADD
   * 4. Semantic conflict detection & branch quarantine (CONCURRENT_FIELD_COLLISION, DELETE_UPDATE_COLLISION)
   */
  public ingestBatch(projectId: string, operations: SyncOperation[]): BatchIngestResult {
    return this.runTransaction(() => {
      const acks: OperationAcknowledgement[] = [];
      const committedOps: SyncOperation[] = [];
      const detectedConflicts: ConflictRecord[] = [];

      let currentSeq = this.getHighestServerSeq(projectId);
      const snapshot = this.getWorkspaceSnapshot(projectId);

      for (const op of operations) {
        // 1. Enforce project scope
        if (op.projectId !== projectId) {
          acks.push({
            opId: op.opId,
            serverSeq: null,
            status: 'REJECTED',
            reason: `Cross-project scope mismatch: operation projectId '${op.projectId}' does not match target '${projectId}'`
          });
          continue;
        }

        // 2. Check if opId already exists (Idempotency check)
        const existingOp = this.getOperationByOpId(op.opId);

        if (existingOp) {
          if (isIdenticalOperation(op, existingOp)) {
            acks.push({
              opId: op.opId,
              serverSeq: existingOp.serverSeq,
              status: 'DUPLICATE_IGNORED'
            });
          } else {
            acks.push({
              opId: op.opId,
              serverSeq: null,
              status: 'REJECTED',
              reason: 'CONFLICTING_OP_ID: opId already exists with differing immutable content'
            });
          }
          continue;
        }

        // 3. DAG Invariant Enforcement for DEPENDENCY_ADD and TASK_CREATE
        if (op.type === 'DEPENDENCY_ADD') {
          const payload = op.payload as { taskId?: string; dependsOnTaskId: string };
          const taskId = payload.taskId || op.entityId;
          const dagCheck = validateDependencyAddition(
            snapshot.tasks,
            taskId,
            payload.dependsOnTaskId
          );

          if (!dagCheck.valid) {
            acks.push({
              opId: op.opId,
              serverSeq: null,
              status: 'REJECTED',
              reason: dagCheck.reason || 'INVARIANT_VIOLATION: DEPENDENCY_CYCLE'
            });
            continue;
          }
        }

        if (op.type === 'TASK_CREATE') {
          const payload = op.payload as any;
          if (Array.isArray(payload.dependencies) && payload.dependencies.includes(op.entityId)) {
            acks.push({
              opId: op.opId,
              serverSeq: null,
              status: 'REJECTED',
              reason: 'INVARIANT_VIOLATION: SELF_DEPENDENCY_FORBIDDEN'
            });
            continue;
          }
        }

        // Entity existence check for updates and deletes
        if (op.type === 'TASK_UPDATE_FIELD' || op.type === 'TASK_DELETE') {
          const existsInSnapshot = snapshot.tasks.some((t) => t.id === op.entityId);
          if (!existsInSnapshot) {
            const createRow = this.db
              .prepare("SELECT 1 FROM operations WHERE project_id = ? AND entity_id = ? AND type = 'TASK_CREATE'")
              .get(projectId, op.entityId);

            if (!createRow) {
              acks.push({
                opId: op.opId,
                serverSeq: null,
                status: 'REJECTED',
                reason: `TASK_NOT_FOUND: Entity '${op.entityId}' does not exist in workspace`
              });
              continue;
            }
          }
        }

        // 4. Semantic Conflict Evaluation against recent concurrent operations and existing unresolved conflicts
        const recentOpsOnEntity = this.getRecentOperationsOnEntity(projectId, op.entityId, 50);
        let hasConflict = false;

        for (const prevOp of recentOpsOnEntity) {
          const causality = evaluateCausality(op.versionVector, prevOp.versionVector);

          if (causality === 'CONCURRENT') {
            // Check Conflict Scenario A: Delete vs Update collision
            if (
              (op.type === 'TASK_DELETE' && prevOp.type === 'TASK_UPDATE_FIELD') ||
              (op.type === 'TASK_UPDATE_FIELD' && prevOp.type === 'TASK_DELETE')
            ) {
              const conflict: ConflictRecord = {
                conflictId: crypto.randomUUID(),
                projectId,
                entityId: op.entityId,
                type: 'DELETE_UPDATE_COLLISION',
                status: 'UNRESOLVED',
                branchA: {
                  replicaId: prevOp.replicaId,
                  opId: prevOp.opId,
                  value: prevOp.payload,
                  timestamp: prevOp.timestamp
                },
                branchB: {
                  replicaId: op.replicaId,
                  opId: op.opId,
                  value: op.payload,
                  timestamp: op.timestamp
                },
                suggestedResolution: {
                  suggestedValue: prevOp.type === 'TASK_DELETE' ? 'DELETED' : 'UPDATED',
                  confidence: 0.5,
                  rationale: 'Delete vs update concurrent collision requires user review'
                }
              };

              this.insertConflict(conflict);
              detectedConflicts.push(conflict);
              hasConflict = true;
              break;
            }

            // Check Conflict Scenario B: Concurrent updates on the same scalar field
            if (op.type === 'TASK_UPDATE_FIELD' && prevOp.type === 'TASK_UPDATE_FIELD') {
              const opField = (op.payload as any).field;
              const prevField = (prevOp.payload as any).field;

              if (opField === prevField) {
                const opVal = (op.payload as any).newValue;
                const prevVal = (prevOp.payload as any).newValue;

                // If values differ, this is an incompatible collision
                if (JSON.stringify(opVal) !== JSON.stringify(prevVal)) {
                  const conflict: ConflictRecord = {
                    conflictId: crypto.randomUUID(),
                    projectId,
                    entityId: op.entityId,
                    field: opField,
                    type: 'CONCURRENT_FIELD_COLLISION',
                    status: 'UNRESOLVED',
                    branchA: {
                      replicaId: prevOp.replicaId,
                      opId: prevOp.opId,
                      value: prevVal,
                      timestamp: prevOp.timestamp
                    },
                    branchB: {
                      replicaId: op.replicaId,
                      opId: op.opId,
                      value: opVal,
                      timestamp: op.timestamp
                    },
                    suggestedResolution: {
                      suggestedValue: opVal,
                      confidence: 0.5,
                      rationale: `Concurrent updates to field '${opField}'`
                    }
                  };

                  this.insertConflict(conflict);
                  detectedConflicts.push(conflict);
                  hasConflict = true;
                  break;
                }
              }
              // Note: If opField !== prevField, orthogonal field-level merge is allowed!
            }
          }
        }

        // Check if entity is already quarantined under an existing unresolved conflict
        if (!hasConflict) {
          const unresolvedForEntity = this.getUnresolvedConflicts(projectId).filter(
            (c) => c.entityId === op.entityId
          );
          for (const unres of unresolvedForEntity) {
            if (unres.type === 'DELETE_UPDATE_COLLISION') {
              hasConflict = true;
              break;
            }
            if (unres.type === 'CONCURRENT_FIELD_COLLISION' && op.type === 'TASK_UPDATE_FIELD') {
              const opField = (op.payload as any).field;
              if (unres.field === opField) {
                hasConflict = true;
                break;
              }
            }
          }
        }

        // 5. Commit operation to log with next serverSeq
        currentSeq += 1;
        const committedOp: SyncOperation = {
          ...op,
          serverSeq: currentSeq
        };

        this.insertOperation(committedOp);
        this.updateProjectSequence(projectId, currentSeq);

        // If no conflicting collision occurred, apply change directly to snapshot
        if (!hasConflict) {
          this.applyToSnapshot(projectId, committedOp, snapshot);
        }

        acks.push({
          opId: committedOp.opId,
          serverSeq: currentSeq,
          status: 'ACCEPTED'
        });

        committedOps.push(committedOp);
      }

      return { acks, committedOps, detectedConflicts };
    });
  }

  /**
   * Resolves an unresolved conflict manually.
   * Atomically records CONFLICT_RESOLVE operation, updates snapshot,
   * marks conflict as RESOLVED, and stores resolution pattern if rememberDecision is true.
   */
  public resolveConflict(
    projectId: string,
    replicaId: string,
    payload: ConflictResolutionPayload
  ): { ack: OperationAcknowledgement; resolutionOp?: SyncOperation; conflict?: ConflictRecord } {
    return this.runTransaction(() => {
      const conflict = this.getConflictById(payload.conflictId);

      if (!conflict || conflict.projectId !== projectId) {
        return {
          ack: {
            opId: `res-${payload.conflictId}`,
            serverSeq: null,
            status: 'REJECTED',
            reason: `CONFLICT_NOT_FOUND: Conflict '${payload.conflictId}' does not exist for project '${projectId}'`
          }
        };
      }

      if (conflict.entityId !== payload.entityId) {
        return {
          ack: {
            opId: `res-${payload.conflictId}`,
            serverSeq: null,
            status: 'REJECTED',
            reason: `ENTITY_MISMATCH: Conflict entity '${conflict.entityId}' does not match payload entity '${payload.entityId}'`
          }
        };
      }

      // Idempotency: if already resolved, return accepted
      if (conflict.status === 'RESOLVED') {
        return {
          ack: {
            opId: `res-${payload.conflictId}`,
            serverSeq: this.getHighestServerSeq(projectId),
            status: 'ACCEPTED'
          },
          conflict
        };
      }

      // Check task in snapshot and DAG invariant
      const snapshot = this.getWorkspaceSnapshot(projectId);
      const targetTask = snapshot.tasks.find((t) => t.id === payload.entityId);

      if (!targetTask) {
        return {
          ack: {
            opId: `res-${payload.conflictId}`,
            serverSeq: null,
            status: 'REJECTED',
            reason: `TASK_NOT_FOUND: Entity '${payload.entityId}' does not exist in workspace snapshot`
          }
        };
      }

      // Simulate resolution to ensure graph remains globally acyclic
      const simulatedTasks = snapshot.tasks.map((t) => ({ ...t, dependencies: [...t.dependencies] }));
      const simTarget = simulatedTasks.find((t) => t.id === payload.entityId);
      if (simTarget) {
        Object.assign(simTarget, payload.resolvedFields);
        if (!isGraphGloballyAcyclic(simulatedTasks)) {
          return {
            ack: {
              opId: `res-${payload.conflictId}`,
              serverSeq: null,
              status: 'REJECTED',
              reason: 'INVARIANT_VIOLATION: DEPENDENCY_CYCLE (Resolution would create a dependency cycle)'
            }
          };
        }
      }

      let currentSeq = this.getHighestServerSeq(projectId) + 1;
      const now = Date.now();

      // Create CONFLICT_RESOLVE operation
      const resolutionOp: SyncOperation = {
        opId: `resolve-${payload.conflictId}-${now}`,
        projectId,
        entityId: payload.entityId,
        type: 'CONFLICT_RESOLVE',
        payload,
        replicaId,
        clientSeq: (this.getProjectVersionVector(projectId)[replicaId] || 0) + 1,
        serverSeq: currentSeq,
        lamportTime: now,
        versionVector: this.getProjectVersionVector(projectId),
        timestamp: now
      };

      // Persist operation
      this.insertOperation(resolutionOp);
      this.updateProjectSequence(projectId, currentSeq);

      // Apply resolution to snapshot
      Object.assign(targetTask, payload.resolvedFields);
      targetTask.version += 1;
      targetTask.updatedAt = new Date().toISOString();

      // Update snapshot in SQLite
      const stmt = this.db.prepare(`
        INSERT INTO document_snapshots (project_id, server_seq, version_vector, snapshot_data, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(project_id) DO UPDATE SET
          server_seq = excluded.server_seq,
          snapshot_data = excluded.snapshot_data,
          updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(projectId, currentSeq, JSON.stringify(snapshot.versionVector), JSON.stringify(snapshot.tasks));

      // Update conflict record
      const updateConflictStmt = this.db.prepare(`
        UPDATE conflicts 
        SET status = 'RESOLVED',
            winning_value = ?,
            resolved_by = ?,
            resolved_at = CURRENT_TIMESTAMP
        WHERE conflict_id = ?
      `);
      updateConflictStmt.run(JSON.stringify(payload.resolvedFields), replicaId, payload.conflictId);

      // Persist to resolution memory if requested
      if (payload.rememberDecision) {
        this.saveResolutionMemory(conflict, payload);
      }

      conflict.status = 'RESOLVED';
      conflict.winningValue = payload.resolvedFields;
      conflict.resolvedBy = replicaId;
      conflict.resolvedAt = new Date().toISOString();

      return {
        ack: {
          opId: resolutionOp.opId,
          serverSeq: currentSeq,
          status: 'ACCEPTED'
        },
        resolutionOp,
        conflict
      };
    });
  }

  /**
   * Retrieves or builds the workspace snapshot for a project.
   */
  public getWorkspaceSnapshot(projectId: string): WorkspaceSnapshot {
    const row = this.db
      .prepare('SELECT * FROM document_snapshots WHERE project_id = ?')
      .get(projectId) as Record<string, unknown> | undefined;

    const conflicts = this.getUnresolvedConflicts(projectId);
    const vector = this.getProjectVersionVector(projectId);
    const highestSeq = this.getHighestServerSeq(projectId);

    if (row && row.snapshot_data) {
      let tasks: TaskEntity[] = [];
      try {
        tasks = JSON.parse(row.snapshot_data as string);
      } catch {
        tasks = [];
      }
      return {
        projectId,
        serverSeq: (row.server_seq as number) || highestSeq,
        versionVector: vector,
        tasks: tasks.filter((t) => !t.isDeleted),
        unresolvedConflicts: conflicts
      };
    }

    // Reconstruct from operations log if no snapshot row
    const allOps = this.getOperationsAfterSeq(projectId, 0, 10000);
    const taskMap = new Map<string, TaskEntity>();

    for (const op of allOps) {
      this.reduceOperationToTaskMap(taskMap, op);
    }

    const tasks = Array.from(taskMap.values()).filter((t) => !t.isDeleted);

    return {
      projectId,
      serverSeq: highestSeq,
      versionVector: vector,
      tasks,
      unresolvedConflicts: conflicts
    };
  }

  // --- Private Helpers ---

  private getRecentOperationsOnEntity(projectId: string, entityId: string, limit = 5): SyncOperation[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM operations 
         WHERE project_id = ? AND entity_id = ? AND type != 'CONFLICT_RESOLVE' 
         ORDER BY server_seq DESC 
         LIMIT ?`
      )
      .all(projectId, entityId, limit) as Record<string, unknown>[];

    return rows.map((r) => this.mapRowToOperation(r));
  }

  private insertOperation(op: SyncOperation): void {
    const stmt = this.db.prepare(`
      INSERT INTO operations (
        op_id, project_id, entity_id, type, payload,
        replica_id, client_seq, server_seq, lamport_time,
        version_vector, timestamp
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      op.opId,
      op.projectId,
      op.entityId,
      op.type,
      JSON.stringify(op.payload),
      op.replicaId,
      op.clientSeq,
      op.serverSeq,
      op.lamportTime,
      JSON.stringify(op.versionVector),
      op.timestamp
    );
  }

  private insertConflict(conflict: ConflictRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO conflicts (
        conflict_id, project_id, entity_id, field, type, status,
        branch_a, branch_b, suggested_resolution, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, CURRENT_TIMESTAMP
      )
    `);

    stmt.run(
      conflict.conflictId,
      conflict.projectId,
      conflict.entityId,
      conflict.field || null,
      conflict.type,
      conflict.status,
      JSON.stringify(conflict.branchA),
      JSON.stringify(conflict.branchB),
      conflict.suggestedResolution ? JSON.stringify(conflict.suggestedResolution) : null
    );
  }

  private saveResolutionMemory(conflict: ConflictRecord, payload: ConflictResolutionPayload): void {
    const patternRaw = `${conflict.type}:${conflict.field || ''}:${JSON.stringify(conflict.branchA.value)}|${JSON.stringify(conflict.branchB.value)}`;
    const patternHash = crypto.createHash('sha256').update(patternRaw).digest('hex');

    const stmt = this.db.prepare(`
      INSERT INTO resolution_memory (
        id, pattern_hash, conflict_type, field, chosen_pattern, resolution_data, times_applied, last_used
      ) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(pattern_hash) DO UPDATE SET
        times_applied = times_applied + 1,
        last_used = CURRENT_TIMESTAMP
    `);

    stmt.run(
      crypto.randomUUID(),
      patternHash,
      conflict.type,
      conflict.field || 'general',
      payload.resolutionStrategy,
      JSON.stringify(payload.resolvedFields)
    );
  }

  private updateProjectSequence(projectId: string, nextSeq: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO project_sequences (project_id, last_server_seq, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id) DO UPDATE SET
        last_server_seq = excluded.last_server_seq,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(projectId, nextSeq);
  }

  private applyToSnapshot(projectId: string, op: SyncOperation, snapshot: WorkspaceSnapshot): void {
    const taskMap = new Map<string, TaskEntity>();
    for (const t of snapshot.tasks) {
      taskMap.set(t.id, t);
    }

    this.reduceOperationToTaskMap(taskMap, op);

    const updatedTasks = Array.from(taskMap.values());
    snapshot.tasks = updatedTasks.filter((t) => !t.isDeleted);
    snapshot.serverSeq = op.serverSeq || snapshot.serverSeq;

    const stmt = this.db.prepare(`
      INSERT INTO document_snapshots (project_id, server_seq, version_vector, snapshot_data, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id) DO UPDATE SET
        server_seq = excluded.server_seq,
        snapshot_data = excluded.snapshot_data,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      projectId,
      op.serverSeq,
      JSON.stringify(snapshot.versionVector),
      JSON.stringify(updatedTasks)
    );
  }

  private reduceOperationToTaskMap(taskMap: Map<string, TaskEntity>, op: SyncOperation): void {
    const now = new Date(op.timestamp).toISOString();

    switch (op.type) {
      case 'TASK_CREATE': {
        const payload = op.payload as any;
        taskMap.set(op.entityId, {
          id: op.entityId,
          projectId: op.projectId,
          title: payload.title || 'Untitled',
          description: payload.description || '',
          status: payload.status || 'TODO',
          priority: payload.priority || 'MEDIUM',
          dueDate: payload.dueDate || null,
          dependencies: Array.isArray(payload.dependencies) ? payload.dependencies : [],
          version: 1,
          updatedAt: now,
          isDeleted: false
        });
        break;
      }

      case 'TASK_UPDATE_FIELD': {
        const task = taskMap.get(op.entityId);
        if (task) {
          const payload = op.payload as any;
          (task as any)[payload.field] = payload.newValue;
          task.version += 1;
          task.updatedAt = now;
        }
        break;
      }

      case 'TASK_DELETE': {
        const task = taskMap.get(op.entityId);
        if (task) {
          task.isDeleted = true;
          task.version += 1;
          task.updatedAt = now;
        }
        break;
      }

      case 'DEPENDENCY_ADD': {
        const payload = op.payload as any;
        const taskId = payload.taskId || op.entityId;
        const task = taskMap.get(taskId);
        if (task && payload.dependsOnTaskId && !task.dependencies.includes(payload.dependsOnTaskId)) {
          task.dependencies.push(payload.dependsOnTaskId);
          task.version += 1;
          task.updatedAt = now;
        }
        break;
      }

      case 'DEPENDENCY_REMOVE': {
        const payload = op.payload as any;
        const taskId = payload.taskId || op.entityId;
        const task = taskMap.get(taskId);
        if (task && payload.dependsOnTaskId) {
          task.dependencies = task.dependencies.filter((d) => d !== payload.dependsOnTaskId);
          task.version += 1;
          task.updatedAt = now;
        }
        break;
      }

      case 'CONFLICT_RESOLVE': {
        const task = taskMap.get(op.entityId);
        const payload = op.payload as ConflictResolutionPayload;
        if (task && payload.resolvedFields) {
          Object.assign(task, payload.resolvedFields);
          task.version += 1;
          task.updatedAt = now;
        }
        break;
      }
    }
  }

  private mapRowToOperation(r: Record<string, unknown>): SyncOperation {
    return {
      opId: r.op_id as string,
      projectId: r.project_id as string,
      entityId: r.entity_id as string,
      type: r.type as OperationType,
      payload: JSON.parse(r.payload as string),
      replicaId: r.replica_id as string,
      clientSeq: r.client_seq as number,
      serverSeq: r.server_seq as number | null,
      lamportTime: r.lamport_time as number,
      versionVector: JSON.parse(r.version_vector as string),
      timestamp: r.timestamp as number
    };
  }

  private mapRowToConflict(r: Record<string, unknown>): ConflictRecord {
    return {
      conflictId: r.conflict_id as string,
      projectId: r.project_id as string,
      entityId: r.entity_id as string,
      field: (r.field as any) || undefined,
      type: r.type as any,
      status: r.status as any,
      branchA: JSON.parse(r.branch_a as string),
      branchB: JSON.parse(r.branch_b as string),
      suggestedResolution: r.suggested_resolution ? JSON.parse(r.suggested_resolution as string) : undefined,
      resolvedAt: (r.resolved_at as string) || undefined,
      resolvedBy: (r.resolved_by as string) || undefined,
      winningValue: r.winning_value ? JSON.parse(r.winning_value as string) : undefined
    };
  }
}
