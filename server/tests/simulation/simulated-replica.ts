import type {
  SyncOperation,
  VersionVector,
  OperationAcknowledgement,
  ConflictRecord,
  ConflictResolutionPayload,
  SyncCatchup,
  TaskEntity,
  TaskStatus,
  TaskPriority,
  UpdatableTaskField,
  SyncHandshake
} from '@nexussync/shared';
import { mergeVectors } from '@nexussync/shared';
import type { SimulatedNetwork } from './simulated-network.js';

export class SimulatedReplica {
  public readonly replicaId: string;
  public readonly projectId: string;
  public clientSeq = 0;
  public lastServerSeq = 0;
  public versionVector: VersionVector = {};
  public pendingQueue: SyncOperation[] = [];
  public acknowledgedOpIds: Set<string> = new Set();
  public appliedOpIds: Set<string> = new Set();
  public tasks: Map<string, TaskEntity> = new Map();
  public unresolvedConflicts: Map<string, ConflictRecord> = new Map();

  constructor(replicaId: string, projectId: string) {
    this.replicaId = replicaId;
    this.projectId = projectId;
    this.versionVector[replicaId] = 0;
  }

  // --- Local Optimistic Mutations ---

  public createTask(
    entityId: string,
    title = `Task ${entityId}`,
    description = '',
    status: TaskStatus = 'TODO',
    priority: TaskPriority = 'MEDIUM',
    dueDate: string | null = null,
    dependencies: string[] = []
  ): SyncOperation {
    this.clientSeq += 1;
    this.versionVector[this.replicaId] = this.clientSeq;

    const op: SyncOperation = {
      opId: `op-${this.replicaId}-${this.clientSeq}`,
      projectId: this.projectId,
      entityId,
      type: 'TASK_CREATE',
      payload: {
        entityId,
        title,
        description,
        status,
        priority,
        dueDate,
        dependencies
      },
      replicaId: this.replicaId,
      clientSeq: this.clientSeq,
      serverSeq: null,
      lamportTime: Date.now(),
      versionVector: { ...this.versionVector },
      timestamp: Date.now()
    };

    this.pendingQueue.push(op);
    this.applyOperationLocally(op);
    return op;
  }

  public updateTaskField(
    entityId: string,
    field: UpdatableTaskField,
    newValue: unknown
  ): SyncOperation {
    this.clientSeq += 1;
    this.versionVector[this.replicaId] = this.clientSeq;

    const currentTask = this.tasks.get(entityId);
    const oldValue = currentTask ? (currentTask as any)[field] : null;

    const op: SyncOperation = {
      opId: `op-${this.replicaId}-${this.clientSeq}`,
      projectId: this.projectId,
      entityId,
      type: 'TASK_UPDATE_FIELD',
      payload: {
        entityId,
        field,
        oldValue,
        newValue
      },
      replicaId: this.replicaId,
      clientSeq: this.clientSeq,
      serverSeq: null,
      lamportTime: Date.now(),
      versionVector: { ...this.versionVector },
      timestamp: Date.now()
    };

    this.pendingQueue.push(op);
    this.applyOperationLocally(op);
    return op;
  }

  public deleteTask(entityId: string): SyncOperation {
    this.clientSeq += 1;
    this.versionVector[this.replicaId] = this.clientSeq;

    const op: SyncOperation = {
      opId: `op-${this.replicaId}-${this.clientSeq}`,
      projectId: this.projectId,
      entityId,
      type: 'TASK_DELETE',
      payload: { entityId },
      replicaId: this.replicaId,
      clientSeq: this.clientSeq,
      serverSeq: null,
      lamportTime: Date.now(),
      versionVector: { ...this.versionVector },
      timestamp: Date.now()
    };

    this.pendingQueue.push(op);
    this.applyOperationLocally(op);
    return op;
  }

  public addDependency(taskId: string, dependsOnTaskId: string): SyncOperation {
    this.clientSeq += 1;
    this.versionVector[this.replicaId] = this.clientSeq;

    const op: SyncOperation = {
      opId: `op-${this.replicaId}-${this.clientSeq}`,
      projectId: this.projectId,
      entityId: taskId,
      type: 'DEPENDENCY_ADD',
      payload: { taskId, dependsOnTaskId },
      replicaId: this.replicaId,
      clientSeq: this.clientSeq,
      serverSeq: null,
      lamportTime: Date.now(),
      versionVector: { ...this.versionVector },
      timestamp: Date.now()
    };

    this.pendingQueue.push(op);
    this.applyOperationLocally(op);
    return op;
  }

  public removeDependency(taskId: string, dependsOnTaskId: string): SyncOperation {
    this.clientSeq += 1;
    this.versionVector[this.replicaId] = this.clientSeq;

    const op: SyncOperation = {
      opId: `op-${this.replicaId}-${this.clientSeq}`,
      projectId: this.projectId,
      entityId: taskId,
      type: 'DEPENDENCY_REMOVE',
      payload: { taskId, dependsOnTaskId },
      replicaId: this.replicaId,
      clientSeq: this.clientSeq,
      serverSeq: null,
      lamportTime: Date.now(),
      versionVector: { ...this.versionVector },
      timestamp: Date.now()
    };

    this.pendingQueue.push(op);
    this.applyOperationLocally(op);
    return op;
  }

  // --- Network Transmission Methods ---

  public flushPendingOps(network: SimulatedNetwork, maxBatch = 50): void {
    if (this.pendingQueue.length === 0) return;
    const batch = this.pendingQueue.slice(0, maxBatch);
    network.send(this.replicaId, 'SERVER', 'PUSH_OPS', { operations: batch });
  }

  public requestCatchup(network: SimulatedNetwork): void {
    const handshake: SyncHandshake = {
      replicaId: this.replicaId,
      projectId: this.projectId,
      knownVector: { ...this.versionVector },
      lastServerSeq: this.lastServerSeq
    };
    network.send(this.replicaId, 'SERVER', 'HANDSHAKE', handshake);
  }

  public requestResolveConflict(
    network: SimulatedNetwork,
    payload: ConflictResolutionPayload
  ): void {
    network.send(this.replicaId, 'SERVER', 'RESOLVE_CONFLICT', payload);
  }

  // --- Incoming Message Handlers ---

  public onAcks(acks: OperationAcknowledgement[]): void {
    for (const ack of acks) {
      if (ack.status === 'ACCEPTED' || ack.status === 'DUPLICATE_IGNORED') {
        this.acknowledgedOpIds.add(ack.opId);
        this.pendingQueue = this.pendingQueue.filter((op) => op.opId !== ack.opId);

        // Only advance lastServerSeq if strictly contiguous with local applied sequence.
        // If there is a gap (ack.serverSeq > lastServerSeq + 1), do NOT advance
        // so catch-up can retrieve the intermediate missed server history.
        if (ack.serverSeq !== null && ack.serverSeq === this.lastServerSeq + 1) {
          this.lastServerSeq = ack.serverSeq;
        }
      }
    }
  }

  public onBroadcastOps(operations: SyncOperation[]): void {
    for (const op of operations) {
      if (this.appliedOpIds.has(op.opId)) continue;
      const applied = this.applyOperationLocally(op);
      if (applied) {
        this.appliedOpIds.add(op.opId);
        this.versionVector = mergeVectors(this.versionVector, op.versionVector);

        // Only advance lastServerSeq if this operation is strictly contiguous.
        if (op.serverSeq !== null && op.serverSeq === this.lastServerSeq + 1) {
          this.lastServerSeq = op.serverSeq;
        }
      }
    }
  }

  public onCatchup(catchup: SyncCatchup): void {
    // Sort missedOps strictly by serverSeq ASC for deterministic causal application
    const sortedOps = [...catchup.missedOps].sort((a, b) => (a.serverSeq || 0) - (b.serverSeq || 0));

    for (const op of sortedOps) {
      const applied = this.applyOperationLocally(op);
      if (applied) {
        this.appliedOpIds.add(op.opId);
      }
      // If op was pending on this replica and has now been committed on server, clear it
      this.pendingQueue = this.pendingQueue.filter((p) => p.opId !== op.opId);
      this.acknowledgedOpIds.add(op.opId);
    }

    this.lastServerSeq = Math.max(this.lastServerSeq, catchup.currentServerSeq);
    this.versionVector = mergeVectors(this.versionVector, catchup.currentVector);

    this.unresolvedConflicts.clear();
    for (const c of catchup.unresolvedConflicts) {
      this.unresolvedConflicts.set(c.conflictId, c);
    }
  }

  public onConflictDetected(conflict: ConflictRecord): void {
    this.unresolvedConflicts.set(conflict.conflictId, conflict);
  }

  public onConflictResolved(conflictId: string, resolutionOp: SyncOperation): void {
    this.unresolvedConflicts.delete(conflictId);
    const applied = this.applyOperationLocally(resolutionOp);
    if (applied) {
      this.appliedOpIds.add(resolutionOp.opId);
    }
  }

  public getActiveTasks(): TaskEntity[] {
    return Array.from(this.tasks.values()).filter((t) => !t.isDeleted);
  }

  // --- Internal Reducer ---

  private applyOperationLocally(op: SyncOperation): boolean {
    const now = new Date(op.timestamp).toISOString();

    switch (op.type) {
      case 'TASK_CREATE': {
        const payload = op.payload as any;
        this.tasks.set(op.entityId, {
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
        return true;
      }

      case 'TASK_UPDATE_FIELD': {
        const task = this.tasks.get(op.entityId);
        if (!task) return false;
        const payload = op.payload as any;
        (task as any)[payload.field] = payload.newValue;
        task.version += 1;
        task.updatedAt = now;
        return true;
      }

      case 'TASK_DELETE': {
        const task = this.tasks.get(op.entityId);
        if (!task) return false;
        task.isDeleted = true;
        task.version += 1;
        task.updatedAt = now;
        return true;
      }

      case 'DEPENDENCY_ADD': {
        const payload = op.payload as any;
        const taskId = payload.taskId || op.entityId;
        const task = this.tasks.get(taskId);
        if (!task) return false;
        if (payload.dependsOnTaskId && !task.dependencies.includes(payload.dependsOnTaskId)) {
          task.dependencies.push(payload.dependsOnTaskId);
          task.version += 1;
          task.updatedAt = now;
        }
        return true;
      }

      case 'DEPENDENCY_REMOVE': {
        const payload = op.payload as any;
        const taskId = payload.taskId || op.entityId;
        const task = this.tasks.get(taskId);
        if (!task) return false;
        if (payload.dependsOnTaskId) {
          task.dependencies = task.dependencies.filter((d) => d !== payload.dependsOnTaskId);
          task.version += 1;
          task.updatedAt = now;
        }
        return true;
      }

      case 'CONFLICT_RESOLVE': {
        const payload = op.payload as ConflictResolutionPayload;
        const task = this.tasks.get(op.entityId);
        if (!task) return false;
        if (payload.resolvedFields) {
          Object.assign(task, payload.resolvedFields);
          task.version += 1;
          task.updatedAt = now;
        }
        return true;
      }
    }
  }
}
