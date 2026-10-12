import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { createServer } from '../src/server.js';
import { initDatabase, closeDatabase, getDb } from '../src/db/database.js';
import { OperationsRepository } from '../src/db/operations-repository.js';
import type {
  SyncOperation,
  SyncHandshake,
  SyncCatchup,
  OperationAcknowledgement
} from '@nexussync/shared';

describe('Frontend-to-Backend Full Integration Flow', () => {
  let httpServer: any;
  let serverPort: number;
  let clientAlice: ClientSocket;
  let clientBob: ClientSocket;
  let expressApp: any;

  beforeAll(async () => {
    initDatabase(':memory:');
    const repo = new OperationsRepository(getDb());
    const { httpServer: srv, app } = createServer(repo);
    httpServer = srv;
    expressApp = app;

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address() as AddressInfo;
        serverPort = addr.port;
        resolve();
      });
    });

    const serverUrl = `http://localhost:${serverPort}`;

    clientAlice = ioc(serverUrl, { reconnection: false });
    clientBob = ioc(serverUrl, { reconnection: false });

    await Promise.all([
      new Promise<void>((resolve) => clientAlice.on('connect', () => resolve())),
      new Promise<void>((resolve) => clientBob.on('connect', () => resolve()))
    ]);
  });

  afterAll(async () => {
    clientAlice.disconnect();
    clientBob.disconnect();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    closeDatabase();
  });

  it('verifies REST health and empty workspace snapshot for proj-observatory', async () => {
    // 1. Health check
    const healthRes = await request(expressApp).get('/api/v1/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('healthy');

    // 2. Snapshot
    const snapRes = await request(expressApp).get('/api/v1/workspaces/proj-observatory/snapshot');
    expect(snapRes.status).toBe(200);
    expect(snapRes.body.data.projectId).toBe('proj-observatory');
    expect(snapRes.body.data.tasks).toEqual([]);
    expect(snapRes.body.data.serverSeq).toBe(0);
  });

  it('ensures pristine workspace contains zero demo records and zero fake conflicts', async () => {
    const freshRes = await request(expressApp).get('/api/v1/workspaces/proj-pristine/snapshot');
    expect(freshRes.status).toBe(200);
    expect(freshRes.body.data.projectId).toBe('proj-pristine');
    expect(freshRes.body.data.tasks).toEqual([]);
    expect(freshRes.body.data.unresolvedConflicts).toEqual([]);
    expect(freshRes.body.data.serverSeq).toBe(0);
  });

  it('performs Socket.IO handshake for both clients', async () => {
    const handshakeAlice: SyncHandshake = {
      replicaId: 'replica-alice',
      projectId: 'proj-observatory',
      knownVector: {},
      lastServerSeq: 0
    };

    const catchupAlice = await new Promise<SyncCatchup>((resolve) => {
      clientAlice.emit('client:handshake', handshakeAlice, (res: SyncCatchup) => resolve(res));
    });

    expect(catchupAlice.currentServerSeq).toBe(0);
    expect(catchupAlice.missedOps).toEqual([]);

    const handshakeBob: SyncHandshake = {
      replicaId: 'replica-bob',
      projectId: 'proj-observatory',
      knownVector: {},
      lastServerSeq: 0
    };

    const catchupBob = await new Promise<SyncCatchup>((resolve) => {
      clientBob.emit('client:handshake', handshakeBob, (res: SyncCatchup) => resolve(res));
    });

    expect(catchupBob.currentServerSeq).toBe(0);
  });

  it('submits a task creation op from Alice and verifies ack and broadcast to Bob', async () => {
    const taskOp: SyncOperation = {
      opId: 'op-task-create-1',
      projectId: 'proj-observatory',
      entityId: 'task-obs-1',
      type: 'TASK_CREATE',
      payload: {
        entityId: 'task-obs-1',
        title: 'Launch Observatory Telescope',
        description: 'Verify optical alignment',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
        dependencies: []
      },
      replicaId: 'replica-alice',
      clientSeq: 1,
      serverSeq: null,
      lamportTime: 1,
      versionVector: { 'replica-alice': 1 },
      timestamp: Date.now()
    };

    const bobReceivePromise = new Promise<{ operations: SyncOperation[] }>((resolve) => {
      clientBob.once('server:broadcast-ops', (payload) => resolve(payload));
    });

    const ackPromise = new Promise<{ acks: OperationAcknowledgement[] }>((resolve) => {
      clientAlice.emit('client:push-ops', { operations: [taskOp] }, (res: any) => resolve(res));
    });

    const [ackRes, bobRes] = await Promise.all([ackPromise, bobReceivePromise]);

    expect(ackRes.acks).toHaveLength(1);
    expect(ackRes.acks[0].opId).toBe('op-task-create-1');
    expect(ackRes.acks[0].status).toBe('ACCEPTED');
    expect(ackRes.acks[0].serverSeq).toBe(1);

    expect(bobRes.operations).toHaveLength(1);
    expect(bobRes.operations[0].opId).toBe('op-task-create-1');
    expect(bobRes.operations[0].serverSeq).toBe(1);

    // Verify REST snapshot now contains the created task
    const snapRes = await request(expressApp).get('/api/v1/workspaces/proj-observatory/snapshot');
    expect(snapRes.body.data.tasks).toHaveLength(1);
    expect(snapRes.body.data.tasks[0].title).toBe('Launch Observatory Telescope');
    expect(snapRes.body.data.serverSeq).toBe(1);
  });

  it('handles concurrent field modifications, detects conflict, allows AI advisory check, and resolves deterministically', async () => {
    // 1. Alice updates priority to HIGH
    const opAlice: SyncOperation = {
      opId: 'op-alice-prio',
      projectId: 'proj-observatory',
      entityId: 'task-obs-1',
      type: 'TASK_UPDATE_FIELD',
      payload: {
        entityId: 'task-obs-1',
        field: 'priority',
        oldValue: 'MEDIUM',
        newValue: 'HIGH'
      },
      replicaId: 'replica-alice',
      clientSeq: 2,
      serverSeq: null,
      lamportTime: 2,
      versionVector: { 'replica-alice': 2, 'replica-bob': 1 },
      timestamp: Date.now() + 10
    };

    await new Promise<void>((resolve) => {
      clientAlice.emit('client:push-ops', { operations: [opAlice] }, () => resolve());
    });

    // 2. Bob listens for conflict notification
    const conflictPromise = new Promise<any>((resolve) => {
      clientBob.once('server:conflict-detected', (data) => resolve(data));
    });

    // Bob concurrently updates priority to CRITICAL
    const opBob: SyncOperation = {
      opId: 'op-bob-prio',
      projectId: 'proj-observatory',
      entityId: 'task-obs-1',
      type: 'TASK_UPDATE_FIELD',
      payload: {
        entityId: 'task-obs-1',
        field: 'priority',
        oldValue: 'MEDIUM',
        newValue: 'CRITICAL'
      },
      replicaId: 'replica-bob',
      clientSeq: 2,
      serverSeq: null,
      lamportTime: 2,
      versionVector: { 'replica-alice': 1, 'replica-bob': 2 },
      timestamp: Date.now() + 20
    };

    clientBob.emit('client:push-ops', { operations: [opBob] });

    const conflictEvent = await conflictPromise;
    expect(conflictEvent).toBeDefined();
    expect(conflictEvent.conflict).toBeDefined();
    expect(conflictEvent.conflict.type).toBe('CONCURRENT_FIELD_COLLISION');
    expect(conflictEvent.conflict.field).toBe('priority');

    const conflictId = conflictEvent.conflict.conflictId;

    // 3. Test Conflict Advisor Endpoint
    // In test environment without OLLAMA_API_KEY, expect 503 unconfigured error
    const adviceRes = await request(expressApp)
      .post(`/api/v1/workspaces/proj-observatory/conflicts/${conflictId}/advise`)
      .send();

    // The endpoint returns 503 when Ollama is not configured in environment
    expect([200, 503]).toContain(adviceRes.status);
    if (adviceRes.status === 503) {
      expect(adviceRes.body.code).toBe('ADVISOR_UNCONFIGURED');
    }

    // 4. Resolve conflict explicitly via Socket.IO
    const resolutionPromise = new Promise<any>((resolve) => {
      clientAlice.once('server:conflict-resolved', (data) => resolve(data));
    });

    const resolveAck = await new Promise<any>((resolve) => {
      clientBob.emit(
        'client:resolve-conflict',
        {
          conflictId,
          entityId: 'task-obs-1',
          resolutionStrategy: 'CHOOSE_B',
          resolvedFields: { priority: 'CRITICAL' },
          rememberDecision: true
        },
        (res: any) => resolve(res)
      );
    });

    expect(resolveAck.ack.status).toBe('ACCEPTED');

    const resolvedEvent = await resolutionPromise;
    expect(resolvedEvent.conflictId).toBe(conflictId);
    expect(resolvedEvent.resolutionOp.type).toBe('CONFLICT_RESOLVE');

    // 5. Verify authoritative snapshot is converged to CRITICAL
    const finalSnap = await request(expressApp).get('/api/v1/workspaces/proj-observatory/snapshot');
    expect(finalSnap.body.data.tasks[0].priority).toBe('CRITICAL');
  });
});
