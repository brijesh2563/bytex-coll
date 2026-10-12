import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { createServer } from '../src/server.js';
import { initDatabase, closeDatabase, getDb } from '../src/db/database.js';
import { OperationsRepository } from '../src/db/operations-repository.js';
import type {
  SyncOperation,
  SyncCatchup,
  SyncHandshake,
  OperationAcknowledgement
} from '@nexussync/shared';

describe('Real-Time Socket.IO Synchronization Pipeline', () => {
  let httpServer: any;
  let serverPort: number;
  let client1: ClientSocket;
  let client2: ClientSocket;
  let clientOtherRoom: ClientSocket;

  beforeAll(async () => {
    initDatabase(':memory:');
    const repo = new OperationsRepository(getDb());
    const { httpServer: srv } = createServer(repo);
    httpServer = srv;

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address() as AddressInfo;
        serverPort = addr.port;
        resolve();
      });
    });

    const serverUrl = `http://localhost:${serverPort}`;

    client1 = ioc(serverUrl, { reconnection: false });
    client2 = ioc(serverUrl, { reconnection: false });
    clientOtherRoom = ioc(serverUrl, { reconnection: false });

    await Promise.all([
      new Promise<void>((resolve) => client1.on('connect', () => resolve())),
      new Promise<void>((resolve) => client2.on('connect', () => resolve())),
      new Promise<void>((resolve) => clientOtherRoom.on('connect', () => resolve()))
    ]);
  });

  afterAll(async () => {
    client1.disconnect();
    client2.disconnect();
    clientOtherRoom.disconnect();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    closeDatabase();
  });

  it('performs client:handshake and returns deterministic catchup payload', async () => {
    const handshakeData: SyncHandshake = {
      replicaId: 'client-1',
      projectId: 'proj-collab',
      knownVector: {},
      lastServerSeq: 0
    };

    const catchup = await new Promise<SyncCatchup>((resolve) => {
      client1.emit('client:handshake', handshakeData, (res: SyncCatchup) => {
        resolve(res);
      });
    });

    expect(catchup).toBeDefined();
    expect(catchup.currentServerSeq).toBe(0);
    expect(catchup.missedOps).toEqual([]);
    expect(catchup.unresolvedConflicts).toEqual([]);
  });

  it('ingests operations, emits acks, and broadcasts committed ops to peers in same room only', async () => {
    // Handshake client2 into proj-collab
    await new Promise<void>((resolve) => {
      client2.emit(
        'client:handshake',
        { replicaId: 'client-2', projectId: 'proj-collab', knownVector: {}, lastServerSeq: 0 },
        () => resolve()
      );
    });

    // Handshake clientOtherRoom into a different project
    await new Promise<void>((resolve) => {
      clientOtherRoom.emit(
        'client:handshake',
        { replicaId: 'client-3', projectId: 'proj-isolated', knownVector: {}, lastServerSeq: 0 },
        () => resolve()
      );
    });

    const opToSubmit: SyncOperation = {
      opId: 'op-collab-101',
      projectId: 'proj-collab',
      entityId: 'task-101',
      type: 'TASK_CREATE',
      payload: {
        entityId: 'task-101',
        title: 'Collaborative Task',
        description: 'First task submitted through socket pipeline',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: null,
        dependencies: []
      },
      replicaId: 'client-1',
      clientSeq: 1,
      serverSeq: null,
      lamportTime: 1,
      versionVector: { 'client-1': 1 },
      timestamp: Date.now()
    };

    let clientOtherReceived = false;
    clientOtherRoom.on('server:broadcast-ops', () => {
      clientOtherReceived = true;
    });

    let client1SelfReceived = false;
    client1.on('server:broadcast-ops', () => {
      client1SelfReceived = true;
    });

    // Client 2 listens for broadcast
    const broadcastPromise = new Promise<{ operations: SyncOperation[] }>((resolve) => {
      client2.on('server:broadcast-ops', (payload) => {
        resolve(payload);
      });
    });

    // Client 1 pushes op
    const ackPromise = new Promise<{ acks: OperationAcknowledgement[] }>((resolve) => {
      client1.emit('client:push-ops', { operations: [opToSubmit] }, (res: any) => {
        resolve(res);
      });
    });

    const [ackRes, broadcastRes] = await Promise.all([ackPromise, broadcastPromise]);

    // Verify submitter acknowledgement
    expect(ackRes.acks).toHaveLength(1);
    expect(ackRes.acks[0].opId).toBe('op-collab-101');
    expect(ackRes.acks[0].status).toBe('ACCEPTED');
    expect(ackRes.acks[0].serverSeq).toBe(1);

    // Verify peer received the committed broadcast with serverSeq assigned
    expect(broadcastRes.operations).toHaveLength(1);
    expect(broadcastRes.operations[0].opId).toBe('op-collab-101');
    expect(broadcastRes.operations[0].serverSeq).toBe(1);

    // Verify submittor does NOT receive broadcast (no self-echo)
    expect(client1SelfReceived).toBe(false);

    // Verify other room is isolated
    expect(clientOtherReceived).toBe(false);
  });

  it('rejects malformed push-ops payloads with server:error', async () => {
    const errorPromise = new Promise<any>((resolve) => {
      client1.once('server:error', (err) => {
        resolve(err);
      });
    });

    client1.emit('client:push-ops', { operations: [{ invalid: 'structure' }] });

    const err = await errorPromise;
    expect(err).toBeDefined();
    expect(err.code).toMatch(/MALFORMED_OPERATION/);
  });

  it('broadcasts server:conflict-detected on concurrent collisions and server:conflict-resolved on manual resolution', async () => {
    // 1. Create a base task in proj-collab
    const baseOp: SyncOperation = {
      opId: 'op-base-task',
      projectId: 'proj-collab',
      entityId: 'task-realtime-cf',
      type: 'TASK_CREATE',
      payload: {
        entityId: 'task-realtime-cf',
        title: 'Realtime Conflict Task',
        description: 'For testing socket conflict events',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: null,
        dependencies: []
      },
      replicaId: 'client-1',
      clientSeq: 2,
      serverSeq: null,
      lamportTime: 2,
      versionVector: { 'client-1': 2, 'client-2': 1 },
      timestamp: Date.now()
    };

    await new Promise<void>((resolve) => {
      client1.emit('client:push-ops', { operations: [baseOp] }, () => resolve());
    });

    // 2. Client 1 pushes update to status
    const op1: SyncOperation = {
      opId: 'op-c1-status',
      projectId: 'proj-collab',
      entityId: 'task-realtime-cf',
      type: 'TASK_UPDATE_FIELD',
      payload: { entityId: 'task-realtime-cf', field: 'status', oldValue: 'TODO', newValue: 'IN_PROGRESS' },
      replicaId: 'client-1',
      clientSeq: 3,
      serverSeq: null,
      lamportTime: 3,
      versionVector: { 'client-1': 3, 'client-2': 1 },
      timestamp: Date.now() + 10
    };
    await new Promise<void>((resolve) => {
      client1.emit('client:push-ops', { operations: [op1] }, () => resolve());
    });

    // 3. Client 2 listens for server:conflict-detected
    const conflictDetectedPromise = new Promise<any>((resolve) => {
      client2.once('server:conflict-detected', (data) => {
        resolve(data);
      });
    });

    // Client 2 pushes concurrent update to status (vector {client-1: 2, client-2: 2} is concurrent with {client-1: 3, client-2: 1})
    const op2: SyncOperation = {
      opId: 'op-c2-status',
      projectId: 'proj-collab',
      entityId: 'task-realtime-cf',
      type: 'TASK_UPDATE_FIELD',
      payload: { entityId: 'task-realtime-cf', field: 'status', oldValue: 'TODO', newValue: 'REVIEW' },
      replicaId: 'client-2',
      clientSeq: 2,
      serverSeq: null,
      lamportTime: 2,
      versionVector: { 'client-1': 2, 'client-2': 2 },
      timestamp: Date.now() + 20
    };

    client2.emit('client:push-ops', { operations: [op2] });

    const conflictData = await conflictDetectedPromise;
    expect(conflictData).toBeDefined();
    expect(conflictData.conflict).toBeDefined();
    expect(conflictData.conflict.type).toBe('CONCURRENT_FIELD_COLLISION');
    expect(conflictData.conflict.field).toBe('status');

    const conflictId = conflictData.conflict.conflictId;

    // 4. Client 2 listens for server:conflict-resolved
    const resolvedPromise = new Promise<any>((resolve) => {
      client2.once('server:conflict-resolved', (data) => {
        resolve(data);
      });
    });

    // Client 1 manually resolves the conflict
    const resolveAck = await new Promise<any>((resolve) => {
      client1.emit(
        'client:resolve-conflict',
        {
          conflictId,
          entityId: 'task-realtime-cf',
          resolutionStrategy: 'CHOOSE_A',
          resolvedFields: { status: 'IN_PROGRESS' },
          rememberDecision: false
        },
        (res: any) => resolve(res)
      );
    });

    expect(resolveAck.ack.status).toBe('ACCEPTED');

    const resolvedData = await resolvedPromise;
    expect(resolvedData).toBeDefined();
    expect(resolvedData.conflictId).toBe(conflictId);
    expect(resolvedData.resolutionOp.type).toBe('CONFLICT_RESOLVE');
  });
});
