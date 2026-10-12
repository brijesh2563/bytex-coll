import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimulationHarness } from './simulation/simulation-harness.js';
import { ConvergenceInvariantChecker } from './simulation/convergence-invariants.js';

describe('Step 5 — Distributed Network Fault Scenarios & Convergence Testing', () => {
  let harness: SimulationHarness;

  beforeEach(() => {
    harness = new SimulationHarness({
      projectId: 'proj-scenario-tests',
      seed: 4242
    });
  });

  afterEach(() => {
    harness.close();
  });

  // --- Scenario A: Normal synchronization ---
  it('Scenario A: Normal synchronization across 3 replicas (A, B, C)', () => {
    const replicaA = harness.createReplica('replica-A');
    const replicaB = harness.createReplica('replica-B');
    const replicaC = harness.createReplica('replica-C');

    // 1. Replica A creates task-1
    const opA = replicaA.createTask('task-1', 'Initial Task 1', 'Created by A');
    replicaA.flushPendingOps(harness.network);
    harness.deliverAll();

    expect(replicaA.acknowledgedOpIds.has(opA.opId)).toBe(true);
    expect(replicaA.pendingQueue).toHaveLength(0);

    // 2. Replica B and C should receive broadcast
    expect(replicaB.tasks.has('task-1')).toBe(true);
    expect(replicaC.tasks.has('task-1')).toBe(true);
    expect(replicaB.tasks.get('task-1')?.title).toBe('Initial Task 1');

    // 3. Replica B updates task-1 title
    replicaB.updateTaskField('task-1', 'title', 'Title Updated By B');
    replicaB.flushPendingOps(harness.network);
    harness.deliverAll();

    expect(replicaA.tasks.get('task-1')?.title).toBe('Title Updated By B');
    expect(replicaC.tasks.get('task-1')?.title).toBe('Title Updated By B');

    // 4. Verify all invariants pass
    const report = ConvergenceInvariantChecker.runAll(harness, [replicaA, replicaB, replicaC]);
    expect(report.passed).toBe(true);
    expect(harness.repo.getHighestServerSeq(harness.projectId)).toBe(2);
  });

  // --- Scenario B: Offline partition & reconnect ---
  it('Scenario B: Offline partition of Replica A, concurrent progress by B & C, heal & catchup', () => {
    const replicaA = harness.createReplica('replica-A');
    const replicaB = harness.createReplica('replica-B');
    const replicaC = harness.createReplica('replica-C');

    // Baseline: A creates task-1
    replicaA.createTask('task-1', 'Base Task');
    replicaA.flushPendingOps(harness.network);
    harness.deliverAll();

    // 1. Partition Replica A into isolation: {A} vs {B, C, SERVER}
    harness.partition(['replica-A'], ['replica-B', 'replica-C', 'SERVER']);

    // 2. Replicas B and C continue working
    replicaB.createTask('task-2', 'Task created while A isolated');
    replicaB.flushPendingOps(harness.network);
    harness.deliverAll();

    replicaC.updateTaskField('task-1', 'status', 'IN_PROGRESS');
    replicaC.flushPendingOps(harness.network);
    harness.deliverAll();

    // 3. Replica A generates offline mutations
    replicaA.createTask('task-A-offline', 'Created by A while offline');
    // A attempts to flush, but packets are dropped due to partition
    replicaA.flushPendingOps(harness.network);
    harness.deliverAll();

    // Server has not received A's offline task yet, but has B & C's tasks
    expect(harness.repo.getWorkspaceSnapshot(harness.projectId).tasks.find((t) => t.id === 'task-A-offline')).toBeUndefined();
    expect(replicaA.pendingQueue).toHaveLength(1);

    // 4. Heal the partition
    harness.healPartitions();

    // 5. Replica A reconnects, flushes offline pending ops, and requests catch-up
    replicaA.flushPendingOps(harness.network);
    replicaA.requestCatchup(harness.network);
    harness.deliverAll();

    // 6. Verify Replica A received B & C's changes and server committed A's offline op
    expect(replicaA.pendingQueue).toHaveLength(0);
    expect(replicaA.tasks.has('task-2')).toBe(true);
    expect(replicaA.tasks.get('task-1')?.status).toBe('IN_PROGRESS');
    expect(harness.repo.getWorkspaceSnapshot(harness.projectId).tasks.find((t) => t.id === 'task-A-offline')).toBeDefined();

    // Replicas B & C catch up on A's newly committed task
    replicaB.requestCatchup(harness.network);
    replicaC.requestCatchup(harness.network);
    harness.deliverAll();

    const report = ConvergenceInvariantChecker.runAll(harness, [replicaA, replicaB, replicaC]);
    expect(report.passed).toBe(true);
  });

  // --- Scenario C: Duplicate and reordered messages ---
  it('Scenario C: Duplicate deliveries, out-of-order execution, and conflicting opId reuse rejection', () => {
    // Configure network with duplicate rate and reordering jitter
    harness.network.setFaultConfig({
      duplicateRate: 0.5,
      reorderRate: 0.5,
      minDelayTicks: 1,
      maxDelayTicks: 4
    });

    const replicaA = harness.createReplica('replica-A');
    const replicaB = harness.createReplica('replica-B');

    // Create 3 operations from Replica A
    const op1 = replicaA.createTask('task-dup-1', 'Task 1');
    const op2 = replicaA.createTask('task-dup-2', 'Task 2');
    const op3 = replicaA.updateTaskField('task-dup-1', 'priority', 'CRITICAL');

    // Send operations
    replicaA.flushPendingOps(harness.network);
    // Explicitly send duplicates directly
    harness.network.send('replica-A', 'SERVER', 'PUSH_OPS', { operations: [op1, op2] });
    harness.network.send('replica-A', 'SERVER', 'PUSH_OPS', { operations: [op2, op3] });

    harness.deliverAll(3000);

    // If any ops were pending due to out-of-order delivery, flush retry
    if (replicaA.pendingQueue.length > 0) {
      replicaA.flushPendingOps(harness.network);
      harness.deliverAll(3000);
    }

    // Sequence integrity must not be broken by duplicates
    const seqReport = ConvergenceInvariantChecker.verifySequenceIntegrity(harness);
    expect(seqReport.valid).toBe(true);

    // Only 3 operations should have been committed (serverSeq: 3)
    expect(harness.repo.getHighestServerSeq(harness.projectId)).toBe(3);

    // Test Conflicting opId reuse attempt
    const tamperedOp = {
      ...op1,
      payload: { ...op1.payload, title: 'Tampered Title' }
    };
    const tamperedResult = harness.repo.ingestBatch(harness.projectId, [tamperedOp]);
    expect(tamperedResult.acks[0].status).toBe('REJECTED');
    expect(tamperedResult.acks[0].reason).toMatch(/CONFLICTING_OP_ID/);

    // Catch up both A and B and verify convergence
    replicaA.requestCatchup(harness.network);
    replicaB.requestCatchup(harness.network);
    harness.deliverAll(3000);

    const report = ConvergenceInvariantChecker.runAll(harness, [replicaA, replicaB]);
    expect(report.passed).toBe(true);
  });

  // --- Scenario D: Concurrent conflicting edits ---
  it('Scenario D: Concurrent same-field collision under partition, quarantine, and resolution', () => {
    const replicaA = harness.createReplica('replica-A');
    const replicaB = harness.createReplica('replica-B');
    const replicaC = harness.createReplica('replica-C');

    // Baseline: Task created collaboratively
    replicaA.createTask('task-conflict-1', 'Conflict Target Task', '', 'TODO', 'MEDIUM');
    replicaA.flushPendingOps(harness.network);
    harness.deliverAll();

    replicaB.requestCatchup(harness.network);
    replicaC.requestCatchup(harness.network);
    harness.deliverAll();

    // 1. Partition A and B: {A} vs {B} vs {C, SERVER}
    harness.partition(['replica-A'], ['replica-B']);

    // Replica A updates status to IN_PROGRESS
    replicaA.updateTaskField('task-conflict-1', 'status', 'IN_PROGRESS');

    // Replica B concurrently updates status to REVIEW
    replicaB.updateTaskField('task-conflict-1', 'status', 'REVIEW');

    // 2. Reconnect and flush both branches
    harness.healPartitions();
    replicaA.flushPendingOps(harness.network);
    harness.deliverAll();

    replicaB.flushPendingOps(harness.network);
    harness.deliverAll();

    // 3. Verify conflict was detected and quarantined
    const unresolved = harness.repo.getUnresolvedConflicts(harness.projectId);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0].type).toBe('CONCURRENT_FIELD_COLLISION');
    expect(unresolved[0].field).toBe('status');
    expect(unresolved[0].branchA.value).toBe('IN_PROGRESS');
    expect(unresolved[0].branchB.value).toBe('REVIEW');

    // Authoritative snapshot did NOT silently take the 2nd value (it remains quarantined)
    const snapshot = harness.repo.getWorkspaceSnapshot(harness.projectId);
    expect(snapshot.tasks.find((t) => t.id === 'task-conflict-1')?.status).toBe('IN_PROGRESS');

    // 4. Resolve the conflict
    const conflictId = unresolved[0].conflictId;
    replicaC.requestResolveConflict(harness.network, {
      conflictId,
      entityId: 'task-conflict-1',
      resolutionStrategy: 'MERGE_CUSTOM',
      resolvedFields: { status: 'DONE' },
      rememberDecision: true
    });
    harness.deliverAll();

    // 5. Catch up all replicas
    replicaA.requestCatchup(harness.network);
    replicaB.requestCatchup(harness.network);
    replicaC.requestCatchup(harness.network);
    harness.deliverAll();

    // All replicas now observe resolved status: DONE
    expect(replicaA.tasks.get('task-conflict-1')?.status).toBe('DONE');
    expect(replicaB.tasks.get('task-conflict-1')?.status).toBe('DONE');
    expect(replicaC.tasks.get('task-conflict-1')?.status).toBe('DONE');

    const report = ConvergenceInvariantChecker.runAll(harness, [replicaA, replicaB, replicaC]);
    expect(report.passed).toBe(true);
  });

  // --- Scenario E: Orthogonal edits ---
  it('Scenario E: Concurrent orthogonal edits to independent fields merge deterministically', () => {
    const replicaA = harness.createReplica('replica-A');
    const replicaB = harness.createReplica('replica-B');

    // Baseline task
    replicaA.createTask('task-ortho', 'Base Title', 'Base Description', 'TODO', 'LOW');
    replicaA.flushPendingOps(harness.network);
    harness.deliverAll();
    replicaB.requestCatchup(harness.network);
    harness.deliverAll();

    // Partition
    harness.partition(['replica-A'], ['replica-B']);

    // Replica A mutates priority (independent field 1)
    replicaA.updateTaskField('task-ortho', 'priority', 'CRITICAL');

    // Replica B mutates title (independent field 2)
    replicaB.updateTaskField('task-ortho', 'title', 'Orthogonal Title By B');

    // Heal & Flush
    harness.healPartitions();
    replicaA.flushPendingOps(harness.network);
    replicaB.flushPendingOps(harness.network);
    harness.deliverAll();

    // No conflict generated because fields are orthogonal!
    const unresolved = harness.repo.getUnresolvedConflicts(harness.projectId);
    expect(unresolved).toHaveLength(0);

    // Catch up both replicas
    replicaA.requestCatchup(harness.network);
    replicaB.requestCatchup(harness.network);
    harness.deliverAll();

    // Both valid modifications merged into the task!
    expect(replicaA.tasks.get('task-ortho')?.priority).toBe('CRITICAL');
    expect(replicaA.tasks.get('task-ortho')?.title).toBe('Orthogonal Title By B');
    expect(replicaB.tasks.get('task-ortho')?.priority).toBe('CRITICAL');
    expect(replicaB.tasks.get('task-ortho')?.title).toBe('Orthogonal Title By B');

    const report = ConvergenceInvariantChecker.runAll(harness, [replicaA, replicaB]);
    expect(report.passed).toBe(true);
  });

  // --- Scenario F: Dependency cycles under partition ---
  it('Scenario F: Dependency cycles under partition are detected and rejected without corrupting graph', () => {
    const replicaA = harness.createReplica('replica-A');
    const replicaB = harness.createReplica('replica-B');

    // Base tasks: task-1 and task-2
    replicaA.createTask('task-dag-1', 'Task 1');
    replicaA.createTask('task-dag-2', 'Task 2');
    replicaA.flushPendingOps(harness.network);
    harness.deliverAll();
    replicaB.requestCatchup(harness.network);
    harness.deliverAll();

    // Partition
    harness.partition(['replica-A'], ['replica-B']);

    // Replica A adds: task-1 depends on task-2
    replicaA.addDependency('task-dag-1', 'task-dag-2');

    // Replica B concurrently adds: task-2 depends on task-1
    replicaB.addDependency('task-dag-2', 'task-dag-1');

    // Heal & Flush A first, then B
    harness.healPartitions();
    replicaA.flushPendingOps(harness.network);
    harness.deliverAll();

    // A's addition is accepted
    expect(replicaA.acknowledgedOpIds.size).toBe(3);

    // Now B flushes: adding task-2 -> task-1 creates a cycle with task-1 -> task-2!
    replicaB.flushPendingOps(harness.network);
    harness.deliverAll();

    // B catches up with server state
    replicaB.requestCatchup(harness.network);
    harness.deliverAll();

    // Authoritative snapshot must remain strictly acyclic
    const dagCheck = ConvergenceInvariantChecker.verifyDagSafety(harness);
    expect(dagCheck.valid).toBe(true);

    const snapshot = harness.repo.getWorkspaceSnapshot(harness.projectId);
    const task1 = snapshot.tasks.find((t) => t.id === 'task-dag-1');
    const task2 = snapshot.tasks.find((t) => t.id === 'task-dag-2');

    // task-1 depends on task-2 was accepted
    expect(task1?.dependencies).toContain('task-dag-2');
    // task-2 depends on task-1 was rejected
    expect(task2?.dependencies).not.toContain('task-dag-1');
  });

  // --- Scenario G: Partition recovery with conflict resolution ---
  it('Scenario G: Conflict created and resolved while Replica A is offline; A recovers upon reconnect', () => {
    const replicaA = harness.createReplica('replica-A');
    const replicaB = harness.createReplica('replica-B');
    const replicaC = harness.createReplica('replica-C');

    // Baseline task
    replicaA.createTask('task-res-offline', 'Baseline Task', '', 'TODO', 'LOW');
    replicaA.flushPendingOps(harness.network);
    harness.deliverAll();
    replicaB.requestCatchup(harness.network);
    replicaC.requestCatchup(harness.network);
    harness.deliverAll();

    // 1. Disconnect Replica A completely
    harness.disconnect('replica-A');

    // 2. While A is offline, B and C create concurrent conflicting updates
    // Simulate B update
    replicaB.updateTaskField('task-res-offline', 'priority', 'MEDIUM');
    replicaB.flushPendingOps(harness.network);
    harness.deliverAll();

    // Simulate concurrent update on C
    const cOp = replicaC.updateTaskField('task-res-offline', 'priority', 'CRITICAL');
    // Align C's vector to simulate concurrent branch
    cOp.versionVector = { 'replica-A': 1, 'replica-C': 2 };
    replicaC.flushPendingOps(harness.network);
    harness.deliverAll();

    // Conflict exists
    const unresolved = harness.repo.getUnresolvedConflicts(harness.projectId);
    expect(unresolved).toHaveLength(1);
    const conflictId = unresolved[0].conflictId;

    // 3. Resolve conflict while A is still offline
    replicaB.requestResolveConflict(harness.network, {
      conflictId,
      entityId: 'task-res-offline',
      resolutionStrategy: 'CHOOSE_A',
      resolvedFields: { priority: 'MEDIUM' },
      rememberDecision: true
    });
    harness.deliverAll();

    // 4. Reconnect Replica A and catch up all replicas
    harness.reconnect('replica-A');
    replicaA.requestCatchup(harness.network);
    replicaB.requestCatchup(harness.network);
    replicaC.requestCatchup(harness.network);
    harness.deliverAll();

    // 5. Replica A caught up to final resolved state and has 0 unresolved conflicts
    expect(replicaA.tasks.get('task-res-offline')?.priority).toBe('MEDIUM');
    expect(replicaA.unresolvedConflicts.size).toBe(0);

    const report = ConvergenceInvariantChecker.runAll(harness, [replicaA, replicaB, replicaC]);
    expect(report.passed).toBe(true);
  });
});
