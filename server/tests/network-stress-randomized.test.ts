import { describe, it, expect } from 'vitest';
import { SimulationHarness } from './simulation/simulation-harness.js';
import { ConvergenceInvariantChecker } from './simulation/convergence-invariants.js';

describe('Step 5 — Randomized Network Stress & Invariant Verification Suite', () => {
  const SEEDS = [98765, 54321];

  for (const seed of SEEDS) {
    it(`executes bounded pseudo-random stress scenario with seed ${seed} and converges`, () => {
      const harness = new SimulationHarness({
        projectId: `proj-stress-${seed}`,
        seed,
        faultConfig: {
          dropRate: 0.08,
          duplicateRate: 0.12,
          reorderRate: 0.15,
          minDelayTicks: 1,
          maxDelayTicks: 4
        }
      });

      const replicas = [
        harness.createReplica('replica-1'),
        harness.createReplica('replica-2'),
        harness.createReplica('replica-3'),
        harness.createReplica('replica-4')
      ];

      const rng = harness.rng;
      const createdTaskIds: string[] = [];
      let totalOpsGenerated = 0;

      // Seed 2 initial tasks
      for (let i = 1; i <= 2; i++) {
        const taskId = `task-stress-${i}`;
        createdTaskIds.push(taskId);
        replicas[0].createTask(taskId, `Initial Task ${i}`, 'Stress test baseline', 'TODO', 'MEDIUM');
        totalOpsGenerated++;
      }
      replicas[0].flushPendingOps(harness.network);
      harness.deliverAll();

      // Catch up all replicas to baseline
      for (const rep of replicas) {
        rep.requestCatchup(harness.network);
      }
      harness.deliverAll();

      // Run 40 randomized events
      const ROUNDS = 40;
      for (let round = 1; round <= ROUNDS; round++) {
        const actionType = rng.nextInt(1, 8);
        const replica = rng.pick(replicas);

        switch (actionType) {
          case 1: {
            // Create a new task
            const newId = `task-stress-${createdTaskIds.length + 1}`;
            createdTaskIds.push(newId);
            replica.createTask(newId, `Task ${newId}`, `Description round ${round}`);
            totalOpsGenerated++;
            replica.flushPendingOps(harness.network);
            break;
          }

          case 2: {
            // Mutate field
            if (createdTaskIds.length > 0) {
              const targetId = rng.pick(createdTaskIds);
              const field = rng.pick(['status', 'priority', 'title'] as const);
              let val: any;
              if (field === 'status') val = rng.pick(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);
              else if (field === 'priority') val = rng.pick(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
              else val = `Updated Title R${round}`;

              replica.updateTaskField(targetId, field, val);
              totalOpsGenerated++;
              replica.flushPendingOps(harness.network);
            }
            break;
          }

          case 3: {
            // Add dependency edge
            if (createdTaskIds.length >= 2) {
              const tA = rng.pick(createdTaskIds);
              const tB = rng.pick(createdTaskIds);
              if (tA !== tB) {
                replica.addDependency(tA, tB);
                totalOpsGenerated++;
                replica.flushPendingOps(harness.network);
              }
            }
            break;
          }

          case 4: {
            // Partition network
            const cut = rng.nextInt(1, 3);
            const groupA = replicas.slice(0, cut).map((r) => r.replicaId);
            const groupB = [...replicas.slice(cut).map((r) => r.replicaId), 'SERVER'];
            harness.partition(groupA, groupB);
            break;
          }

          case 5: {
            // Heal partitions
            harness.healPartitions();
            break;
          }

          case 6: {
            // Disconnect or reconnect replica
            const targetReplica = rng.pick(replicas);
            if (harness.network.isNodeConnected(targetReplica.replicaId)) {
              harness.disconnect(targetReplica.replicaId);
            } else {
              harness.reconnect(targetReplica.replicaId);
            }
            break;
          }

          case 7: {
            // Flush pending operations from all replicas
            for (const rep of replicas) {
              rep.flushPendingOps(harness.network);
            }
            break;
          }

          case 8: {
            // Reconnect, catchup, and advance virtual ticks
            const targetReplica = rng.pick(replicas);
            harness.reconnect(targetReplica.replicaId);
            targetReplica.requestCatchup(harness.network);
            break;
          }
        }

        // Advance simulation clock by a few ticks each round
        harness.step(rng.nextInt(1, 3));
      }

      // --- Convergence Phase ---
      // 1. Heal all partitions and reconnect all nodes
      harness.healPartitions();
      for (const rep of replicas) {
        harness.reconnect(rep.replicaId);
      }

      // 2. Clear network drop/duplicate faults for deterministic drain
      harness.network.setFaultConfig({ dropRate: 0, duplicateRate: 0, reorderRate: 0, minDelayTicks: 1, maxDelayTicks: 1 });
      harness.deliverAll();

      // 3. Retry any pending unacknowledged operations
      for (const rep of replicas) {
        rep.flushPendingOps(harness.network);
      }
      harness.deliverAll();

      // 4. Resolve any unresolved conflicts that were created
      const unresolved = harness.repo.getUnresolvedConflicts(harness.projectId);
      for (const conflict of unresolved) {
        replicas[0].requestResolveConflict(harness.network, {
          conflictId: conflict.conflictId,
          entityId: conflict.entityId,
          resolutionStrategy: 'CHOOSE_A',
          resolvedFields: conflict.branchA.value ? { [conflict.field || 'title']: conflict.branchA.value } : {},
          rememberDecision: true
        });
      }
      harness.deliverAll();

      // 5. Catch up all replicas completely
      for (const rep of replicas) {
        rep.requestCatchup(harness.network);
      }
      harness.deliverAll();

      // 6. Comprehensive Invariant Verification
      const report = ConvergenceInvariantChecker.runAll(harness, replicas);
      expect(report.passed).toBe(true);

      // Verify DAG is globally acyclic
      const dagReport = ConvergenceInvariantChecker.verifyDagSafety(harness);
      expect(dagReport.valid).toBe(true);

      // Verify deterministic replay from operation log matches snapshot
      const replayReport = ConvergenceInvariantChecker.verifyDeterministicReplay(harness);
      expect(replayReport.valid).toBe(true);

      // Verify state convergence across all 4 replicas
      const convReport = ConvergenceInvariantChecker.verifyStateConvergence(harness, replicas);
      expect(convReport.valid).toBe(true);

      harness.close();
    });
  }
});
