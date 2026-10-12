import type { SimulationHarness } from './simulation-harness.js';
import type { SimulatedReplica } from './simulated-replica.js';
import { isGraphGloballyAcyclic, type TaskEntity, type SyncOperation } from '@nexussync/shared';

export interface InvariantReport {
  passed: boolean;
  failedInvariants: string[];
  details: Record<string, any>;
}

/**
 * Validates the 10 core distributed convergence and consistency invariants.
 */
export class ConvergenceInvariantChecker {
  /**
   * Invariant 1: Operation Durability
   * Every operation acknowledged as ACCEPTED must be durably stored in the SQLite operations log.
   */
  public static verifyOperationDurability(harness: SimulationHarness): { valid: boolean; reason?: string } {
    for (const [replicaId, replica] of harness.replicas.entries()) {
      for (const opId of replica.acknowledgedOpIds) {
        const stored = harness.repo.getOperationByOpId(opId);
        if (!stored) {
          return {
            valid: false,
            reason: `DURABILITY_VIOLATION: Op '${opId}' acknowledged by replica '${replicaId}' is missing from authoritative operations table`
          };
        }
        if (stored.serverSeq === null || stored.serverSeq <= 0) {
          return {
            valid: false,
            reason: `DURABILITY_VIOLATION: Stored op '${opId}' has invalid serverSeq: ${stored.serverSeq}`
          };
        }
      }
    }
    return { valid: true };
  }

  /**
   * Invariant 2: Idempotency
   * Submitting an already accepted operation must not advance serverSeq or duplicate operations.
   */
  public static verifyIdempotency(harness: SimulationHarness, sampleOp: SyncOperation): { valid: boolean; reason?: string } {
    const seqBefore = harness.repo.getHighestServerSeq(harness.projectId);
    const result = harness.repo.ingestBatch(harness.projectId, [sampleOp]);

    if (result.acks[0].status !== 'DUPLICATE_IGNORED') {
      return {
        valid: false,
        reason: `IDEMPOTENCY_VIOLATION: Expected DUPLICATE_IGNORED but got status '${result.acks[0].status}'`
      };
    }

    const seqAfter = harness.repo.getHighestServerSeq(harness.projectId);
    if (seqBefore !== seqAfter) {
      return {
        valid: false,
        reason: `IDEMPOTENCY_VIOLATION: serverSeq advanced from ${seqBefore} to ${seqAfter} on duplicate submission`
      };
    }

    if (result.committedOps.length > 0) {
      return {
        valid: false,
        reason: 'IDEMPOTENCY_VIOLATION: Duplicate submission was committed again'
      };
    }

    return { valid: true };
  }

  /**
   * Invariant 3: Sequence Integrity
   * serverSeq must be strictly monotonic consecutive integers (1, 2, ..., N) without gaps or duplicates.
   */
  public static verifySequenceIntegrity(harness: SimulationHarness): { valid: boolean; reason?: string } {
    const highest = harness.repo.getHighestServerSeq(harness.projectId);
    if (highest === 0) return { valid: true };

    const ops = harness.repo.getOperationsAfterSeq(harness.projectId, 0, 10000);
    if (ops.length !== highest) {
      return {
        valid: false,
        reason: `SEQUENCE_GAP_OR_MISMATCH: Highest seq is ${highest} but retrieved ${ops.length} operations`
      };
    }

    for (let i = 0; i < ops.length; i++) {
      const expected = i + 1;
      if (ops[i].serverSeq !== expected) {
        return {
          valid: false,
          reason: `SEQUENCE_ORDER_VIOLATION: At index ${i}, expected serverSeq ${expected} but found ${ops[i].serverSeq}`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Invariant 4: Conflict Preservation
   * Unresolved conflicting branches remain available for resolution.
   */
  public static verifyConflictPreservation(harness: SimulationHarness): { valid: boolean; reason?: string } {
    const unresolved = harness.repo.getUnresolvedConflicts(harness.projectId);
    for (const c of unresolved) {
      if (!c.branchA || !c.branchB || !c.branchA.opId || !c.branchB.opId) {
        return {
          valid: false,
          reason: `CONFLICT_PRESERVATION_VIOLATION: Conflict '${c.conflictId}' lacks valid branch branches`
        };
      }
      if (c.status !== 'UNRESOLVED') {
        return {
          valid: false,
          reason: `CONFLICT_STATUS_VIOLATION: Conflict returned by getUnresolvedConflicts has status '${c.status}'`
        };
      }
    }
    return { valid: true };
  }

  /**
   * Invariant 5: DAG Safety
   * The authoritative task dependency graph must be strictly acyclic.
   */
  public static verifyDagSafety(harness: SimulationHarness): { valid: boolean; reason?: string } {
    const snapshot = harness.repo.getWorkspaceSnapshot(harness.projectId);
    const acyclic = isGraphGloballyAcyclic(snapshot.tasks);
    if (!acyclic) {
      return {
        valid: false,
        reason: 'DAG_SAFETY_VIOLATION: Authoritative task snapshot contains directed cycle'
      };
    }
    return { valid: true };
  }

  /**
   * Invariant 6: Resolution Consistency
   * Resolved conflicts produce durable CONFLICT_RESOLVE operations and winning values.
   */
  public static verifyResolutionConsistency(harness: SimulationHarness): { valid: boolean; reason?: string } {
    const rows = harness.db
      .prepare("SELECT * FROM conflicts WHERE project_id = ? AND status = 'RESOLVED'")
      .all(harness.projectId) as any[];

    for (const row of rows) {
      if (!row.winning_value || !row.resolved_by || !row.resolved_at) {
        return {
          valid: false,
          reason: `RESOLUTION_CONSISTENCY_VIOLATION: Conflict '${row.conflict_id}' marked RESOLVED without winning value or metadata`
        };
      }

      // Check corresponding CONFLICT_RESOLVE operation exists in log
      const opRows = harness.db
        .prepare("SELECT * FROM operations WHERE project_id = ? AND type = 'CONFLICT_RESOLVE' AND entity_id = ?")
        .all(harness.projectId, row.entity_id);

      if (opRows.length === 0) {
        return {
          valid: false,
          reason: `RESOLUTION_CONSISTENCY_VIOLATION: Missing CONFLICT_RESOLVE operation in log for resolved entity '${row.entity_id}'`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Invariant 7: Recovery Completeness
   * Once a replica reconnects and catches up, its observed serverSeq must equal highest serverSeq.
   */
  public static verifyRecoveryCompleteness(
    harness: SimulationHarness,
    replica: SimulatedReplica
  ): { valid: boolean; reason?: string } {
    const highest = harness.repo.getHighestServerSeq(harness.projectId);
    if (replica.lastServerSeq !== highest) {
      return {
        valid: false,
        reason: `RECOVERY_INCOMPLETE: Replica '${replica.replicaId}' has lastServerSeq ${replica.lastServerSeq}, but server has ${highest}`
      };
    }
    return { valid: true };
  }

  /**
   * Invariant 8: Deterministic Replay
   * Replaying all committed operations in serverSeq ASC order from an empty state
   * must produce the exact same task map as the cached workspace snapshot.
   */
  public static verifyDeterministicReplay(harness: SimulationHarness): { valid: boolean; reason?: string } {
    const allOps = harness.repo.getOperationsAfterSeq(harness.projectId, 0, 100000);
    const replayed = new Map<string, TaskEntity>();

    for (const op of allOps) {
      const now = new Date(op.timestamp).toISOString();
      switch (op.type) {
        case 'TASK_CREATE': {
          const payload = op.payload as any;
          replayed.set(op.entityId, {
            id: op.entityId,
            projectId: op.projectId,
            title: payload.title || 'Untitled',
            description: payload.description || '',
            status: payload.status || 'TODO',
            priority: payload.priority || 'MEDIUM',
            dueDate: payload.dueDate || null,
            dependencies: Array.isArray(payload.dependencies) ? [...payload.dependencies] : [],
            version: 1,
            updatedAt: now,
            isDeleted: false
          });
          break;
        }
        case 'TASK_UPDATE_FIELD': {
          const task = replayed.get(op.entityId);
          if (task) {
            const payload = op.payload as any;
            (task as any)[payload.field] = payload.newValue;
            task.version += 1;
            task.updatedAt = now;
          }
          break;
        }
        case 'TASK_DELETE': {
          const task = replayed.get(op.entityId);
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
          const task = replayed.get(taskId);
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
          const task = replayed.get(taskId);
          if (task && payload.dependsOnTaskId) {
            task.dependencies = task.dependencies.filter((d) => d !== payload.dependsOnTaskId);
            task.version += 1;
            task.updatedAt = now;
          }
          break;
        }
        case 'CONFLICT_RESOLVE': {
          const payload = op.payload as any;
          const task = replayed.get(op.entityId);
          if (task && payload.resolvedFields) {
            Object.assign(task, payload.resolvedFields);
            task.version += 1;
            task.updatedAt = now;
          }
          break;
        }
      }
    }

    const snapshot = harness.repo.getWorkspaceSnapshot(harness.projectId);
    const activeReplayed = Array.from(replayed.values()).filter((t) => !t.isDeleted);

    if (activeReplayed.length !== snapshot.tasks.length) {
      return {
        valid: false,
        reason: `DETERMINISTIC_REPLAY_MISMATCH: Replayed count (${activeReplayed.length}) != snapshot tasks count (${snapshot.tasks.length})`
      };
    }

    for (const snapTask of snapshot.tasks) {
      const repTask = replayed.get(snapTask.id);
      if (!repTask) {
        return {
          valid: false,
          reason: `DETERMINISTIC_REPLAY_MISMATCH: Task '${snapTask.id}' missing in replayed map`
        };
      }
      if (
        snapTask.title !== repTask.title ||
        snapTask.status !== repTask.status ||
        snapTask.priority !== repTask.priority ||
        snapTask.dueDate !== repTask.dueDate ||
        JSON.stringify(snapTask.dependencies) !== JSON.stringify(repTask.dependencies)
      ) {
        return {
          valid: false,
          reason: `DETERMINISTIC_REPLAY_MISMATCH: Task '${snapTask.id}' state divergence between replay and snapshot`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Invariant 9: Partition Recovery
   * Replicas that were disconnected can heal, flush pending queues, catch up, and have 0 pending operations.
   */
  public static verifyPartitionRecovery(replica: SimulatedReplica): { valid: boolean; reason?: string } {
    if (replica.pendingQueue.length > 0) {
      return {
        valid: false,
        reason: `PARTITION_RECOVERY_INCOMPLETE: Replica '${replica.replicaId}' still has ${replica.pendingQueue.length} pending unacknowledged operations`
      };
    }
    return { valid: true };
  }

  /**
   * Invariant 10: State Convergence
   * Compares the authoritative server snapshot with all caught-up replicas.
   * All replicas that have processed the full committed history must converge to the same state.
   */
  public static verifyStateConvergence(
    harness: SimulationHarness,
    replicas: SimulatedReplica[]
  ): { valid: boolean; reason?: string } {
    const serverSnapshot = harness.repo.getWorkspaceSnapshot(harness.projectId);
    const serverTasks = serverSnapshot.tasks;

    for (const replica of replicas) {
      const replicaActive = replica.getActiveTasks();

      if (replicaActive.length !== serverTasks.length) {
        return {
          valid: false,
          reason: `CONVERGENCE_MISMATCH: Replica '${replica.replicaId}' has ${replicaActive.length} active tasks, server has ${serverTasks.length}`
        };
      }

      for (const sTask of serverTasks) {
        const rTask = replica.tasks.get(sTask.id);
        if (!rTask || rTask.isDeleted) {
          return {
            valid: false,
            reason: `CONVERGENCE_MISMATCH: Task '${sTask.id}' active on server but missing/deleted on replica '${replica.replicaId}'`
          };
        }

        if (
          sTask.title !== rTask.title ||
          sTask.status !== rTask.status ||
          sTask.priority !== rTask.priority ||
          sTask.dueDate !== rTask.dueDate
        ) {
          return {
            valid: false,
            reason: `CONVERGENCE_MISMATCH: Task '${sTask.id}' attributes differ on replica '${replica.replicaId}' vs server`
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Runs all applicable invariant checks on the harness.
   */
  public static runAll(harness: SimulationHarness, caughtUpReplicas?: SimulatedReplica[]): InvariantReport {
    const failed: string[] = [];
    const details: Record<string, any> = {};

    const durability = this.verifyOperationDurability(harness);
    if (!durability.valid) failed.push(durability.reason!);
    details.durability = durability;

    const seq = this.verifySequenceIntegrity(harness);
    if (!seq.valid) failed.push(seq.reason!);
    details.sequenceIntegrity = seq;

    const dag = this.verifyDagSafety(harness);
    if (!dag.valid) failed.push(dag.reason!);
    details.dagSafety = dag;

    const conflicts = this.verifyConflictPreservation(harness);
    if (!conflicts.valid) failed.push(conflicts.reason!);
    details.conflictPreservation = conflicts;

    const resolution = this.verifyResolutionConsistency(harness);
    if (!resolution.valid) failed.push(resolution.reason!);
    details.resolutionConsistency = resolution;

    const replay = this.verifyDeterministicReplay(harness);
    if (!replay.valid) failed.push(replay.reason!);
    details.deterministicReplay = replay;

    if (caughtUpReplicas && caughtUpReplicas.length > 0) {
      for (const rep of caughtUpReplicas) {
        const rec = this.verifyRecoveryCompleteness(harness, rep);
        if (!rec.valid) failed.push(rec.reason!);

        const part = this.verifyPartitionRecovery(rep);
        if (!part.valid) failed.push(part.reason!);
      }

      const conv = this.verifyStateConvergence(harness, caughtUpReplicas);
      if (!conv.valid) failed.push(conv.reason!);
      details.convergence = conv;
    }

    return {
      passed: failed.length === 0,
      failedInvariants: failed,
      details
    };
  }
}
