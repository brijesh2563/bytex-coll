import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { initializeSchema } from '../src/db/schema.js';
import { OperationsRepository } from '../src/db/operations-repository.js';
import type { SyncOperation } from '@nexussync/shared';

describe('OperationsRepository — Durable Ingestion & Monotonic Sequencing', () => {
  let db: DatabaseSync;
  let repo: OperationsRepository;

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

  const createOp = (opId: string, projectId: string, entityId = 'task-1'): SyncOperation => ({
    opId,
    projectId,
    entityId,
    type: 'TASK_CREATE',
    payload: {
      entityId,
      title: `Task ${entityId}`,
      description: 'Test description',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      dependencies: []
    },
    replicaId: 'client-A',
    clientSeq: 1,
    serverSeq: null,
    lamportTime: 1,
    versionVector: { 'client-A': 1 },
    timestamp: 1773000000000
  });

  it('allocates strictly monotonic serverSeq numbers per project', () => {
    const op1 = createOp('op-1', 'proj-1', 'task-1');
    const op2 = createOp('op-2', 'proj-1', 'task-2');

    const result = repo.ingestBatch('proj-1', [op1, op2]);

    expect(result.acks).toHaveLength(2);
    expect(result.acks[0]).toEqual({ opId: 'op-1', serverSeq: 1, status: 'ACCEPTED' });
    expect(result.acks[1]).toEqual({ opId: 'op-2', serverSeq: 2, status: 'ACCEPTED' });
    expect(repo.getHighestServerSeq('proj-1')).toBe(2);
  });

  it('maintains independent sequence scopes for separate projects', () => {
    const opA = createOp('op-A1', 'proj-A');
    const opB = createOp('op-B1', 'proj-B');

    repo.ingestBatch('proj-A', [opA]);
    repo.ingestBatch('proj-B', [opB]);

    expect(repo.getHighestServerSeq('proj-A')).toBe(1);
    expect(repo.getHighestServerSeq('proj-B')).toBe(1);

    const opA2 = createOp('op-A2', 'proj-A');
    repo.ingestBatch('proj-A', [opA2]);

    expect(repo.getHighestServerSeq('proj-A')).toBe(2);
    expect(repo.getHighestServerSeq('proj-B')).toBe(1);
  });

  it('handles identical duplicate submissions idempotently without advancing serverSeq', () => {
    const op = createOp('op-dup-1', 'proj-1');

    const first = repo.ingestBatch('proj-1', [op]);
    expect(first.acks[0].status).toBe('ACCEPTED');
    expect(first.acks[0].serverSeq).toBe(1);
    expect(repo.getHighestServerSeq('proj-1')).toBe(1);

    // Duplicate submission
    const retry = repo.ingestBatch('proj-1', [op]);
    expect(retry.acks[0].status).toBe('DUPLICATE_IGNORED');
    expect(retry.acks[0].serverSeq).toBe(1);
    expect(retry.committedOps).toHaveLength(0); // not committed again
    expect(repo.getHighestServerSeq('proj-1')).toBe(1); // sequence not incremented
  });

  it('rejects conflicting opId reuse with differing immutable payload', () => {
    const originalOp = createOp('op-conflict', 'proj-1');
    repo.ingestBatch('proj-1', [originalOp]);

    const conflictingOp: SyncOperation = {
      ...originalOp,
      payload: {
        ...originalOp.payload,
        title: 'Tampered Title Attempt'
      }
    };

    const result = repo.ingestBatch('proj-1', [conflictingOp]);
    expect(result.acks[0].status).toBe('REJECTED');
    expect(result.acks[0].reason).toMatch(/CONFLICTING_OP_ID/);
    expect(result.committedOps).toHaveLength(0);
  });

  it('rejects cross-project operations within a scoped batch', () => {
    const foreignOp = createOp('op-foreign', 'proj-wrong');
    const result = repo.ingestBatch('proj-correct', [foreignOp]);

    expect(result.acks[0].status).toBe('REJECTED');
    expect(result.acks[0].reason).toMatch(/Cross-project scope mismatch/);
    expect(result.committedOps).toHaveLength(0);
  });

  it('retrieves missed operations strictly ordered by serverSeq ascending', () => {
    const ops = [
      createOp('op-1', 'proj-1', 'task-1'),
      createOp('op-2', 'proj-1', 'task-2'),
      createOp('op-3', 'proj-1', 'task-3')
    ];

    repo.ingestBatch('proj-1', ops);

    const missed = repo.getOperationsAfterSeq('proj-1', 1, 10);
    expect(missed).toHaveLength(2);
    expect(missed[0].serverSeq).toBe(2);
    expect(missed[1].serverSeq).toBe(3);
  });

  it('updates document snapshot progressively upon operation ingestion', () => {
    const create = createOp('op-create', 'proj-1', 'task-101');
    repo.ingestBatch('proj-1', [create]);

    const update: SyncOperation = {
      opId: 'op-update',
      projectId: 'proj-1',
      entityId: 'task-101',
      type: 'TASK_UPDATE_FIELD',
      payload: {
        entityId: 'task-101',
        field: 'status',
        oldValue: 'TODO',
        newValue: 'IN_PROGRESS'
      },
      replicaId: 'client-A',
      clientSeq: 2,
      serverSeq: null,
      lamportTime: 2,
      versionVector: { 'client-A': 2 },
      timestamp: 1773000050000
    };
    repo.ingestBatch('proj-1', [update]);

    const snapshot = repo.getWorkspaceSnapshot('proj-1');
    expect(snapshot.tasks).toHaveLength(1);
    expect(snapshot.tasks[0].id).toBe('task-101');
    expect(snapshot.tasks[0].status).toBe('IN_PROGRESS');
    expect(snapshot.tasks[0].version).toBe(2);
  });
});
