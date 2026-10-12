import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { initializeSchema } from '../src/db/schema.js';
import { OperationsRepository } from '../src/db/operations-repository.js';
import type { SyncOperation, ConflictResolutionPayload } from '@nexussync/shared';

describe('Step 4 — Semantic Conflict Detection & Task Dependency DAG Engine', () => {
  let db: DatabaseSync;
  let repo: OperationsRepository;
  const PROJECT_ID = 'test-proj-step4';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    initializeSchema(db);
    repo = new OperationsRepository(db);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  const createTaskOp = (
    opId: string,
    entityId: string,
    replicaId = 'replica-1',
    vector: Record<string, number> = { 'replica-1': 1 },
    clientSeq = 1,
    dependencies: string[] = []
  ): SyncOperation => ({
    opId,
    projectId: PROJECT_ID,
    entityId,
    type: 'TASK_CREATE',
    payload: {
      entityId,
      title: `Task ${entityId}`,
      description: 'Initial description',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      dependencies
    },
    replicaId,
    clientSeq,
    serverSeq: null,
    lamportTime: clientSeq,
    versionVector: vector,
    timestamp: 1773000000000 + clientSeq * 1000
  });

  describe('1. Task Dependency DAG Invariant Engine', () => {
    it('accepts valid dependency additions between existing tasks', () => {
      const taskA = createTaskOp('op-tA', 'task-A', 'replica-1', { 'replica-1': 1 }, 1);
      const taskB = createTaskOp('op-tB', 'task-B', 'replica-1', { 'replica-1': 2 }, 2);
      repo.ingestBatch(PROJECT_ID, [taskA, taskB]);

      // Add edge: task-B depends on task-A
      const depOp: SyncOperation = {
        opId: 'op-dep-1',
        projectId: PROJECT_ID,
        entityId: 'task-B',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-B', dependsOnTaskId: 'task-A' },
        replicaId: 'replica-1',
        clientSeq: 3,
        serverSeq: null,
        lamportTime: 3,
        versionVector: { 'replica-1': 3 },
        timestamp: 1773000003000
      };

      const result = repo.ingestBatch(PROJECT_ID, [depOp]);
      expect(result.acks[0].status).toBe('ACCEPTED');

      const snapshot = repo.getWorkspaceSnapshot(PROJECT_ID);
      const taskBSnapshot = snapshot.tasks.find((t) => t.id === 'task-B');
      expect(taskBSnapshot?.dependencies).toContain('task-A');
    });

    it('rejects self-dependencies on DEPENDENCY_ADD and TASK_CREATE', () => {
      const taskA = createTaskOp('op-tA', 'task-A', 'replica-1', { 'replica-1': 1 }, 1);
      repo.ingestBatch(PROJECT_ID, [taskA]);

      // Self-dependency on DEPENDENCY_ADD
      const selfDepOp: SyncOperation = {
        opId: 'op-self-dep',
        projectId: PROJECT_ID,
        entityId: 'task-A',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-A', dependsOnTaskId: 'task-A' },
        replicaId: 'replica-1',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-1': 2 },
        timestamp: 1773000002000
      };

      const res1 = repo.ingestBatch(PROJECT_ID, [selfDepOp]);
      expect(res1.acks[0].status).toBe('REJECTED');
      expect(res1.acks[0].reason).toMatch(/SELF_DEPENDENCY_FORBIDDEN/);

      // Self-dependency on TASK_CREATE
      const selfCreate = createTaskOp('op-self-create', 'task-X', 'replica-1', { 'replica-1': 3 }, 3, ['task-X']);
      const res2 = repo.ingestBatch(PROJECT_ID, [selfCreate]);
      expect(res2.acks[0].status).toBe('REJECTED');
      expect(res2.acks[0].reason).toMatch(/SELF_DEPENDENCY_FORBIDDEN/);
    });

    it('rejects direct 2-node cycle (A -> B, then B -> A)', () => {
      const taskA = createTaskOp('op-tA', 'task-A', 'replica-1', { 'replica-1': 1 }, 1);
      const taskB = createTaskOp('op-tB', 'task-B', 'replica-1', { 'replica-1': 2 }, 2);
      repo.ingestBatch(PROJECT_ID, [taskA, taskB]);

      // A depends on B
      const dep1: SyncOperation = {
        opId: 'op-dep-A-B',
        projectId: PROJECT_ID,
        entityId: 'task-A',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-A', dependsOnTaskId: 'task-B' },
        replicaId: 'replica-1',
        clientSeq: 3,
        serverSeq: null,
        lamportTime: 3,
        versionVector: { 'replica-1': 3 },
        timestamp: 1773000003000
      };
      const res1 = repo.ingestBatch(PROJECT_ID, [dep1]);
      expect(res1.acks[0].status).toBe('ACCEPTED');

      // Attempt B depends on A (creates cycle A -> B -> A)
      const dep2: SyncOperation = {
        opId: 'op-dep-B-A',
        projectId: PROJECT_ID,
        entityId: 'task-B',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-B', dependsOnTaskId: 'task-A' },
        replicaId: 'replica-1',
        clientSeq: 4,
        serverSeq: null,
        lamportTime: 4,
        versionVector: { 'replica-1': 4 },
        timestamp: 1773000004000
      };
      const res2 = repo.ingestBatch(PROJECT_ID, [dep2]);
      expect(res2.acks[0].status).toBe('REJECTED');
      expect(res2.acks[0].reason).toMatch(/DEPENDENCY_CYCLE/);

      // Verify snapshot has NOT mutated task-B
      const snapshot = repo.getWorkspaceSnapshot(PROJECT_ID);
      const taskBAfter = snapshot.tasks.find((t) => t.id === 'task-B');
      expect(taskBAfter?.dependencies).not.toContain('task-A');
    });

    it('rejects multi-node cycle (A -> B -> C -> A)', () => {
      const taskA = createTaskOp('op-tA', 'task-A', 'replica-1', { 'replica-1': 1 }, 1);
      const taskB = createTaskOp('op-tB', 'task-B', 'replica-1', { 'replica-1': 2 }, 2);
      const taskC = createTaskOp('op-tC', 'task-C', 'replica-1', { 'replica-1': 3 }, 3);
      repo.ingestBatch(PROJECT_ID, [taskA, taskB, taskC]);

      // A depends on B
      const depAB: SyncOperation = {
        opId: 'op-dep-AB',
        projectId: PROJECT_ID,
        entityId: 'task-A',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-A', dependsOnTaskId: 'task-B' },
        replicaId: 'replica-1',
        clientSeq: 4,
        serverSeq: null,
        lamportTime: 4,
        versionVector: { 'replica-1': 4 },
        timestamp: 1773000004000
      };
      // B depends on C
      const depBC: SyncOperation = {
        opId: 'op-dep-BC',
        projectId: PROJECT_ID,
        entityId: 'task-B',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-B', dependsOnTaskId: 'task-C' },
        replicaId: 'replica-1',
        clientSeq: 5,
        serverSeq: null,
        lamportTime: 5,
        versionVector: { 'replica-1': 5 },
        timestamp: 1773000005000
      };
      repo.ingestBatch(PROJECT_ID, [depAB, depBC]);

      // Attempt C depends on A (creates cycle C -> A -> B -> C)
      const depCA: SyncOperation = {
        opId: 'op-dep-CA',
        projectId: PROJECT_ID,
        entityId: 'task-C',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-C', dependsOnTaskId: 'task-A' },
        replicaId: 'replica-1',
        clientSeq: 6,
        serverSeq: null,
        lamportTime: 6,
        versionVector: { 'replica-1': 6 },
        timestamp: 1773000006000
      };
      const res = repo.ingestBatch(PROJECT_ID, [depCA]);
      expect(res.acks[0].status).toBe('REJECTED');
      expect(res.acks[0].reason).toMatch(/DEPENDENCY_CYCLE/);
    });

    it('rejects dependencies referencing unknown tasks', () => {
      const taskA = createTaskOp('op-tA', 'task-A', 'replica-1', { 'replica-1': 1 }, 1);
      repo.ingestBatch(PROJECT_ID, [taskA]);

      const depUnknown: SyncOperation = {
        opId: 'op-dep-unknown',
        projectId: PROJECT_ID,
        entityId: 'task-A',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-A', dependsOnTaskId: 'task-non-existent' },
        replicaId: 'replica-1',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-1': 2 },
        timestamp: 1773000002000
      };
      const res = repo.ingestBatch(PROJECT_ID, [depUnknown]);
      expect(res.acks[0].status).toBe('REJECTED');
      expect(res.acks[0].reason).toMatch(/PREREQUISITE_NOT_FOUND/);
    });

    it('allows valid diamond DAG topology', () => {
      // Diamond: D depends on B and C; B and C both depend on A
      const taskA = createTaskOp('op-tA', 'task-A', 'replica-1', { 'replica-1': 1 }, 1);
      const taskB = createTaskOp('op-tB', 'task-B', 'replica-1', { 'replica-1': 2 }, 2);
      const taskC = createTaskOp('op-tC', 'task-C', 'replica-1', { 'replica-1': 3 }, 3);
      const taskD = createTaskOp('op-tD', 'task-D', 'replica-1', { 'replica-1': 4 }, 4);
      repo.ingestBatch(PROJECT_ID, [taskA, taskB, taskC, taskD]);

      const depBA: SyncOperation = {
        opId: 'op-BA',
        projectId: PROJECT_ID,
        entityId: 'task-B',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-B', dependsOnTaskId: 'task-A' },
        replicaId: 'replica-1',
        clientSeq: 5,
        serverSeq: null,
        lamportTime: 5,
        versionVector: { 'replica-1': 5 },
        timestamp: 1773000005000
      };
      const depCA: SyncOperation = {
        opId: 'op-CA',
        projectId: PROJECT_ID,
        entityId: 'task-C',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-C', dependsOnTaskId: 'task-A' },
        replicaId: 'replica-1',
        clientSeq: 6,
        serverSeq: null,
        lamportTime: 6,
        versionVector: { 'replica-1': 6 },
        timestamp: 1773000006000
      };
      const depDB: SyncOperation = {
        opId: 'op-DB',
        projectId: PROJECT_ID,
        entityId: 'task-D',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-D', dependsOnTaskId: 'task-B' },
        replicaId: 'replica-1',
        clientSeq: 7,
        serverSeq: null,
        lamportTime: 7,
        versionVector: { 'replica-1': 7 },
        timestamp: 1773000007000
      };
      const depDC: SyncOperation = {
        opId: 'op-DC',
        projectId: PROJECT_ID,
        entityId: 'task-D',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-D', dependsOnTaskId: 'task-C' },
        replicaId: 'replica-1',
        clientSeq: 8,
        serverSeq: null,
        lamportTime: 8,
        versionVector: { 'replica-1': 8 },
        timestamp: 1773000008000
      };

      const res = repo.ingestBatch(PROJECT_ID, [depBA, depCA, depDB, depDC]);
      expect(res.acks.every((a) => a.status === 'ACCEPTED')).toBe(true);

      const snapshot = repo.getWorkspaceSnapshot(PROJECT_ID);
      const taskDObj = snapshot.tasks.find((t) => t.id === 'task-D');
      expect(taskDObj?.dependencies).toEqual(['task-B', 'task-C']);
    });

    it('correctly handles dependency removal and unlocks edges', () => {
      const taskA = createTaskOp('op-tA', 'task-A', 'replica-1', { 'replica-1': 1 }, 1);
      const taskB = createTaskOp('op-tB', 'task-B', 'replica-1', { 'replica-1': 2 }, 2);
      repo.ingestBatch(PROJECT_ID, [taskA, taskB]);

      // A depends on B
      const depAB: SyncOperation = {
        opId: 'op-AB',
        projectId: PROJECT_ID,
        entityId: 'task-A',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-A', dependsOnTaskId: 'task-B' },
        replicaId: 'replica-1',
        clientSeq: 3,
        serverSeq: null,
        lamportTime: 3,
        versionVector: { 'replica-1': 3 },
        timestamp: 1773000003000
      };
      repo.ingestBatch(PROJECT_ID, [depAB]);

      // Remove dependency A depends on B
      const removeDep: SyncOperation = {
        opId: 'op-rem-AB',
        projectId: PROJECT_ID,
        entityId: 'task-A',
        type: 'DEPENDENCY_REMOVE',
        payload: { taskId: 'task-A', dependsOnTaskId: 'task-B' },
        replicaId: 'replica-1',
        clientSeq: 4,
        serverSeq: null,
        lamportTime: 4,
        versionVector: { 'replica-1': 4 },
        timestamp: 1773000004000
      };
      repo.ingestBatch(PROJECT_ID, [removeDep]);

      // Now B depending on A is completely valid!
      const depBA: SyncOperation = {
        opId: 'op-BA-valid',
        projectId: PROJECT_ID,
        entityId: 'task-B',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-B', dependsOnTaskId: 'task-A' },
        replicaId: 'replica-1',
        clientSeq: 5,
        serverSeq: null,
        lamportTime: 5,
        versionVector: { 'replica-1': 5 },
        timestamp: 1773000005000
      };
      const res = repo.ingestBatch(PROJECT_ID, [depBA]);
      expect(res.acks[0].status).toBe('ACCEPTED');
    });
  });

  describe('2. Semantic Conflict Detection & Quarantine', () => {
    it('applies causally ordered same-field updates without triggering conflict', () => {
      const task1 = createTaskOp('op-create-1', 'task-1', 'replica-A', { 'replica-A': 1 }, 1);
      repo.ingestBatch(PROJECT_ID, [task1]);

      // Update 1: status -> IN_PROGRESS
      const update1: SyncOperation = {
        opId: 'op-up-1',
        projectId: PROJECT_ID,
        entityId: 'task-1',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-1', field: 'status', oldValue: 'TODO', newValue: 'IN_PROGRESS' },
        replicaId: 'replica-A',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 2 },
        timestamp: 1773000002000
      };

      // Update 2: status -> DONE (causally follows update 1)
      const update2: SyncOperation = {
        opId: 'op-up-2',
        projectId: PROJECT_ID,
        entityId: 'task-1',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-1', field: 'status', oldValue: 'IN_PROGRESS', newValue: 'DONE' },
        replicaId: 'replica-A',
        clientSeq: 3,
        serverSeq: null,
        lamportTime: 3,
        versionVector: { 'replica-A': 3 },
        timestamp: 1773000003000
      };

      const res = repo.ingestBatch(PROJECT_ID, [update1, update2]);
      expect(res.detectedConflicts).toHaveLength(0);

      const snapshot = repo.getWorkspaceSnapshot(PROJECT_ID);
      const task = snapshot.tasks.find((t) => t.id === 'task-1');
      expect(task?.status).toBe('DONE');
      expect(snapshot.unresolvedConflicts).toHaveLength(0);
    });

    it('deterministically merges concurrent updates to different fields', () => {
      const task1 = createTaskOp('op-base', 'task-1', 'replica-A', { 'replica-A': 1, 'replica-B': 1 }, 1);
      repo.ingestBatch(PROJECT_ID, [task1]);

      // Replica A updates priority concurrently
      const opA: SyncOperation = {
        opId: 'op-repA-priority',
        projectId: PROJECT_ID,
        entityId: 'task-1',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-1', field: 'priority', oldValue: 'MEDIUM', newValue: 'CRITICAL' },
        replicaId: 'replica-A',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 2, 'replica-B': 1 },
        timestamp: 1773000002000
      };

      // Replica B updates title concurrently (neither vector dominates the other: {A:1, B:2} || {A:2, B:1})
      const opB: SyncOperation = {
        opId: 'op-repB-title',
        projectId: PROJECT_ID,
        entityId: 'task-1',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-1', field: 'title', oldValue: 'Task task-1', newValue: 'Updated By Replica B' },
        replicaId: 'replica-B',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 1, 'replica-B': 2 },
        timestamp: 1773000002500
      };

      const resA = repo.ingestBatch(PROJECT_ID, [opA]);
      const resB = repo.ingestBatch(PROJECT_ID, [opB]);

      expect(resA.detectedConflicts).toHaveLength(0);
      expect(resB.detectedConflicts).toHaveLength(0);

      const snapshot = repo.getWorkspaceSnapshot(PROJECT_ID);
      const mergedTask = snapshot.tasks.find((t) => t.id === 'task-1');
      // Both independent fields must be preserved!
      expect(mergedTask?.priority).toBe('CRITICAL');
      expect(mergedTask?.title).toBe('Updated By Replica B');
      expect(snapshot.unresolvedConflicts).toHaveLength(0);
    });

    it('detects concurrent updates to the same field, quarantines both branches, and preserves prior snapshot', () => {
      const task1 = createTaskOp('op-base-cf', 'task-cf', 'replica-A', { 'replica-A': 1, 'replica-B': 1 }, 1);
      repo.ingestBatch(PROJECT_ID, [task1]);

      // Replica A sets status to IN_PROGRESS
      const opA: SyncOperation = {
        opId: 'op-cf-A',
        projectId: PROJECT_ID,
        entityId: 'task-cf',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-cf', field: 'status', oldValue: 'TODO', newValue: 'IN_PROGRESS' },
        replicaId: 'replica-A',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 2, 'replica-B': 1 },
        timestamp: 1773000002000
      };
      repo.ingestBatch(PROJECT_ID, [opA]);

      // Replica B concurrently sets status to REVIEW with concurrent vector
      const opB: SyncOperation = {
        opId: 'op-cf-B',
        projectId: PROJECT_ID,
        entityId: 'task-cf',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-cf', field: 'status', oldValue: 'TODO', newValue: 'REVIEW' },
        replicaId: 'replica-B',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 1, 'replica-B': 2 },
        timestamp: 1773000002100
      };
      const resB = repo.ingestBatch(PROJECT_ID, [opB]);

      // 1. Conflict record created
      expect(resB.detectedConflicts).toHaveLength(1);
      const conflict = resB.detectedConflicts[0];
      expect(conflict.type).toBe('CONCURRENT_FIELD_COLLISION');
      expect(conflict.field).toBe('status');
      expect(conflict.status).toBe('UNRESOLVED');
      expect(conflict.branchA.replicaId).toBe('replica-A');
      expect(conflict.branchA.value).toBe('IN_PROGRESS');
      expect(conflict.branchB.replicaId).toBe('replica-B');
      expect(conflict.branchB.value).toBe('REVIEW');

      // 2. Snapshot quarantine check:
      // The second conflicting value (REVIEW) is quarantined and NOT applied as a silent winner!
      const snapshot = repo.getWorkspaceSnapshot(PROJECT_ID);
      expect(snapshot.unresolvedConflicts).toHaveLength(1);
      expect(snapshot.unresolvedConflicts[0].conflictId).toBe(conflict.conflictId);

      const quarantinedTask = snapshot.tasks.find((t) => t.id === 'task-cf');
      expect(quarantinedTask?.status).toBe('IN_PROGRESS');
    });

    it('detects concurrent delete vs update collision', () => {
      const task1 = createTaskOp('op-base-del', 'task-del', 'replica-A', { 'replica-A': 1, 'replica-B': 1 }, 1);
      repo.ingestBatch(PROJECT_ID, [task1]);

      // Replica A deletes the task
      const opDelete: SyncOperation = {
        opId: 'op-del-A',
        projectId: PROJECT_ID,
        entityId: 'task-del',
        type: 'TASK_DELETE',
        payload: { entityId: 'task-del' },
        replicaId: 'replica-A',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 2, 'replica-B': 1 },
        timestamp: 1773000002000
      };
      repo.ingestBatch(PROJECT_ID, [opDelete]);

      // Replica B concurrently updates title
      const opUpdate: SyncOperation = {
        opId: 'op-up-B',
        projectId: PROJECT_ID,
        entityId: 'task-del',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-del', field: 'title', oldValue: 'Task task-del', newValue: 'Resurrected title?' },
        replicaId: 'replica-B',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 1, 'replica-B': 2 },
        timestamp: 1773000002100
      };
      const res = repo.ingestBatch(PROJECT_ID, [opUpdate]);

      expect(res.detectedConflicts).toHaveLength(1);
      expect(res.detectedConflicts[0].type).toBe('DELETE_UPDATE_COLLISION');
    });
  });

  describe('3. Manual Conflict Resolution Protocol', () => {
    it('successfully resolves an unresolved conflict and applies winning values to snapshot', () => {
      const task = createTaskOp('op-t-res', 'task-res', 'replica-A', { 'replica-A': 1, 'replica-B': 1 }, 1);
      repo.ingestBatch(PROJECT_ID, [task]);

      const opA: SyncOperation = {
        opId: 'op-res-A',
        projectId: PROJECT_ID,
        entityId: 'task-res',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-res', field: 'priority', oldValue: 'MEDIUM', newValue: 'LOW' },
        replicaId: 'replica-A',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 2, 'replica-B': 1 },
        timestamp: 1773000002000
      };
      const opB: SyncOperation = {
        opId: 'op-res-B',
        projectId: PROJECT_ID,
        entityId: 'task-res',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-res', field: 'priority', oldValue: 'MEDIUM', newValue: 'HIGH' },
        replicaId: 'replica-B',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 1, 'replica-B': 2 },
        timestamp: 1773000002100
      };

      repo.ingestBatch(PROJECT_ID, [opA]);
      const resB = repo.ingestBatch(PROJECT_ID, [opB]);
      const conflictId = resB.detectedConflicts[0].conflictId;

      // Now resolve the conflict manually
      const resolutionPayload: ConflictResolutionPayload = {
        conflictId,
        entityId: 'task-res',
        resolutionStrategy: 'MERGE_CUSTOM',
        resolvedFields: { priority: 'CRITICAL' },
        rememberDecision: true
      };

      const resResult = repo.resolveConflict(PROJECT_ID, 'moderator-1', resolutionPayload);
      expect(resResult.ack.status).toBe('ACCEPTED');
      expect(resResult.conflict?.status).toBe('RESOLVED');
      expect(resResult.resolutionOp).toBeDefined();
      expect(resResult.resolutionOp?.type).toBe('CONFLICT_RESOLVE');

      // Verify snapshot updated
      const snapshot = repo.getWorkspaceSnapshot(PROJECT_ID);
      expect(snapshot.unresolvedConflicts).toHaveLength(0); // Quarantined conflict cleared!
      const resolvedTask = snapshot.tasks.find((t) => t.id === 'task-res');
      expect(resolvedTask?.priority).toBe('CRITICAL');

      // Verify resolution memory stored
      const memRow = db.prepare('SELECT * FROM resolution_memory').get() as any;
      expect(memRow).toBeDefined();
      expect(memRow.conflict_type).toBe('CONCURRENT_FIELD_COLLISION');
      expect(memRow.chosen_pattern).toBe('MERGE_CUSTOM');
    });

    it('handles idempotent retries of conflict resolution without re-executing', () => {
      const task = createTaskOp('op-t-idem', 'task-idem', 'replica-A', { 'replica-A': 1, 'replica-B': 1 }, 1);
      repo.ingestBatch(PROJECT_ID, [task]);

      const opA: SyncOperation = {
        opId: 'op-idem-A',
        projectId: PROJECT_ID,
        entityId: 'task-idem',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-idem', field: 'status', oldValue: 'TODO', newValue: 'IN_PROGRESS' },
        replicaId: 'replica-A',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 2, 'replica-B': 1 },
        timestamp: 1773000002000
      };
      const opB: SyncOperation = {
        opId: 'op-idem-B',
        projectId: PROJECT_ID,
        entityId: 'task-idem',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-idem', field: 'status', oldValue: 'TODO', newValue: 'DONE' },
        replicaId: 'replica-B',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-A': 1, 'replica-B': 2 },
        timestamp: 1773000002100
      };

      repo.ingestBatch(PROJECT_ID, [opA]);
      const resB = repo.ingestBatch(PROJECT_ID, [opB]);
      const conflictId = resB.detectedConflicts[0].conflictId;

      const resolutionPayload: ConflictResolutionPayload = {
        conflictId,
        entityId: 'task-idem',
        resolutionStrategy: 'CHOOSE_A',
        resolvedFields: { status: 'IN_PROGRESS' },
        rememberDecision: false
      };

      const firstAttempt = repo.resolveConflict(PROJECT_ID, 'user-1', resolutionPayload);
      expect(firstAttempt.ack.status).toBe('ACCEPTED');

      // Retry same resolution
      const retryAttempt = repo.resolveConflict(PROJECT_ID, 'user-1', resolutionPayload);
      expect(retryAttempt.ack.status).toBe('ACCEPTED');
      expect(retryAttempt.conflict?.status).toBe('RESOLVED');
    });

    it('rejects conflict resolution with mismatched entity ID or non-existent conflict', () => {
      const resUnknown = repo.resolveConflict(PROJECT_ID, 'user-1', {
        conflictId: 'non-existent-conflict',
        entityId: 'task-1',
        resolutionStrategy: 'CHOOSE_A',
        resolvedFields: { status: 'DONE' },
        rememberDecision: false
      });
      expect(resUnknown.ack.status).toBe('REJECTED');
      expect(resUnknown.ack.reason).toMatch(/CONFLICT_NOT_FOUND/);
    });

    it('rejects conflict resolution that would violate task dependency DAG invariants', () => {
      // Create task-A and task-B with task-B depending on task-A
      const taskA = createTaskOp('op-tA-dag', 'task-A', 'replica-1', { 'replica-1': 1 }, 1);
      const taskB = createTaskOp('op-tB-dag', 'task-B', 'replica-1', { 'replica-1': 2 }, 2);
      repo.ingestBatch(PROJECT_ID, [taskA, taskB]);

      // task-B depends on task-A
      const depBA: SyncOperation = {
        opId: 'op-depBA',
        projectId: PROJECT_ID,
        entityId: 'task-B',
        type: 'DEPENDENCY_ADD',
        payload: { taskId: 'task-B', dependsOnTaskId: 'task-A' },
        replicaId: 'replica-1',
        clientSeq: 3,
        serverSeq: null,
        lamportTime: 3,
        versionVector: { 'replica-1': 3 },
        timestamp: 1773000003000
      };
      repo.ingestBatch(PROJECT_ID, [depBA]);

      // Create a conflict on task-A
      const op1: SyncOperation = {
        opId: 'op-A1',
        projectId: PROJECT_ID,
        entityId: 'task-A',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-A', field: 'title', oldValue: 'Task task-A', newValue: 'Title 1' },
        replicaId: 'replica-1',
        clientSeq: 4,
        serverSeq: null,
        lamportTime: 4,
        versionVector: { 'replica-1': 4, 'replica-2': 1 },
        timestamp: 1773000004000
      };
      const op2: SyncOperation = {
        opId: 'op-A2',
        projectId: PROJECT_ID,
        entityId: 'task-A',
        type: 'TASK_UPDATE_FIELD',
        payload: { entityId: 'task-A', field: 'title', oldValue: 'Task task-A', newValue: 'Title 2' },
        replicaId: 'replica-2',
        clientSeq: 2,
        serverSeq: null,
        lamportTime: 2,
        versionVector: { 'replica-1': 3, 'replica-2': 2 },
        timestamp: 1773000004100
      };

      repo.ingestBatch(PROJECT_ID, [op1]);
      const resOp2 = repo.ingestBatch(PROJECT_ID, [op2]);
      const conflictId = resOp2.detectedConflicts[0].conflictId;

      // Attempt resolution that modifies task-A dependencies to depend on task-B (creates cycle!)
      const badResolution: ConflictResolutionPayload = {
        conflictId,
        entityId: 'task-A',
        resolutionStrategy: 'MERGE_CUSTOM',
        resolvedFields: {
          title: 'Resolved Title',
          // @ts-expect-error test illegal dependency injection in resolution
          dependencies: ['task-B']
        },
        rememberDecision: false
      };

      const res = repo.resolveConflict(PROJECT_ID, 'user-1', badResolution);
      expect(res.ack.status).toBe('REJECTED');
      expect(res.ack.reason).toMatch(/DEPENDENCY_CYCLE/);
    });
  });
});
