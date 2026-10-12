import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server.js';
import { initDatabase, closeDatabase, getDb } from '../src/db/database.js';
import { OperationsRepository } from '../src/db/operations-repository.js';
import type { SyncOperation } from '@nexussync/shared';

describe('Workspace REST Endpoints', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    initDatabase(':memory:');
    app = createApp();

    // Populate a test task via repository
    const repo = new OperationsRepository(getDb());
    const op: SyncOperation = {
      opId: 'op-init-task',
      projectId: 'proj-demo',
      entityId: 'task-root',
      type: 'TASK_CREATE',
      payload: {
        entityId: 'task-root',
        title: 'Initial Workspace Task',
        description: 'Demonstration task created during test',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: '2026-10-31T00:00:00Z',
        dependencies: []
      },
      replicaId: 'client-test',
      clientSeq: 1,
      serverSeq: null,
      lamportTime: 1,
      versionVector: { 'client-test': 1 },
      timestamp: 1773000000000
    };
    repo.ingestBatch('proj-demo', [op]);
  });

  afterAll(() => {
    closeDatabase();
  });

  it('GET /api/v1/workspaces/:projectId/snapshot returns 200 OK with populated tasks', async () => {
    const res = await request(app).get('/api/v1/workspaces/proj-demo/snapshot');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.projectId).toBe('proj-demo');
    expect(res.body.data.serverSeq).toBe(1);
    expect(res.body.data.tasks).toHaveLength(1);
    expect(res.body.data.tasks[0].id).toBe('task-root');
    expect(res.body.data.tasks[0].title).toBe('Initial Workspace Task');
  });

  it('GET /api/v1/workspaces/:projectId/snapshot returns empty tasks for empty workspace', async () => {
    const res = await request(app).get('/api/v1/workspaces/empty-proj/snapshot');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.projectId).toBe('empty-proj');
    expect(res.body.data.serverSeq).toBe(0);
    expect(res.body.data.tasks).toEqual([]);
  });
});
