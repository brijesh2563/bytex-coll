import { DatabaseSync } from 'node:sqlite';
import { initializeSchema } from '../../src/db/schema.js';
import { OperationsRepository } from '../../src/db/operations-repository.js';
import { SimulatedNetwork, type NetworkFaultConfig } from './simulated-network.js';
import { SimulatedReplica } from './simulated-replica.js';
import { SeededRandom } from './seeded-random.js';
import type {
  SyncCatchup,
  SyncHandshake,
  ConflictResolutionPayload,
  SyncOperation
} from '@nexussync/shared';

export interface HarnessConfig {
  projectId?: string;
  seed?: number | string;
  faultConfig?: NetworkFaultConfig;
}

export class SimulationHarness {
  public readonly projectId: string;
  public readonly db: DatabaseSync;
  public readonly repo: OperationsRepository;
  public readonly network: SimulatedNetwork;
  public readonly rng: SeededRandom;
  public readonly replicas: Map<string, SimulatedReplica> = new Map();

  constructor(config: HarnessConfig = {}) {
    this.projectId = config.projectId || 'proj-simulation-default';
    this.rng = new SeededRandom(config.seed ?? 1337);
    this.network = new SimulatedNetwork(config.faultConfig, this.rng);

    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');
    initializeSchema(this.db);

    this.repo = new OperationsRepository(this.db);

    this.registerServerNode();
  }

  public createReplica(replicaId: string): SimulatedReplica {
    if (this.replicas.has(replicaId)) {
      return this.replicas.get(replicaId)!;
    }

    const replica = new SimulatedReplica(replicaId, this.projectId);
    this.replicas.set(replicaId, replica);

    this.network.registerNode(replicaId, (msg) => {
      switch (msg.type) {
        case 'ACK_OPS':
          replica.onAcks(msg.payload.acks);
          break;
        case 'BROADCAST_OPS':
          replica.onBroadcastOps(msg.payload.operations);
          break;
        case 'CATCHUP':
          replica.onCatchup(msg.payload);
          break;
        case 'CONFLICT_DETECTED':
          replica.onConflictDetected(msg.payload.conflict);
          break;
        case 'CONFLICT_RESOLVED':
          replica.onConflictResolved(msg.payload.conflictId, msg.payload.resolutionOp);
          break;
      }
    });

    return replica;
  }

  public step(ticks = 1): number {
    return this.network.step(ticks);
  }

  public deliverAll(maxTicks = 2000): number {
    return this.network.runUntilEmpty(maxTicks);
  }

  public partition(groupA: string[], groupB: string[]): void {
    this.network.partition([groupA, groupB]);
  }

  public healPartitions(): void {
    this.network.healPartitions();
  }

  public disconnect(replicaId: string): void {
    this.network.disconnect(replicaId);
  }

  public reconnect(replicaId: string): void {
    this.network.reconnect(replicaId);
  }

  public close(): void {
    if (this.db) {
      this.db.close();
    }
  }

  private registerServerNode(): void {
    this.network.registerNode('SERVER', (msg) => {
      switch (msg.type) {
        case 'PUSH_OPS': {
          const ops: SyncOperation[] = msg.payload.operations;
          const { acks, committedOps, detectedConflicts } = this.repo.ingestBatch(this.projectId, ops);

          // 1. Send ACKs back to submitter
          this.network.send('SERVER', msg.sender, 'ACK_OPS', { acks });

          // 2. Broadcast committed operations to all other replicas in project
          if (committedOps.length > 0) {
            for (const [replicaId] of this.replicas.entries()) {
              if (replicaId !== msg.sender) {
                this.network.send('SERVER', replicaId, 'BROADCAST_OPS', { operations: committedOps });
              }
            }
          }

          // 3. Broadcast detected conflicts to all replicas in project
          if (detectedConflicts && detectedConflicts.length > 0) {
            for (const conflict of detectedConflicts) {
              for (const [replicaId] of this.replicas.entries()) {
                this.network.send('SERVER', replicaId, 'CONFLICT_DETECTED', { conflict });
              }
            }
          }
          break;
        }

        case 'HANDSHAKE': {
          const handshake: SyncHandshake = msg.payload;
          const currentServerSeq = this.repo.getHighestServerSeq(this.projectId);
          const currentVector = this.repo.getProjectVersionVector(this.projectId);
          const missedOps = this.repo.getOperationsAfterSeq(this.projectId, handshake.lastServerSeq, 500);
          const unresolvedConflicts = this.repo.getUnresolvedConflicts(this.projectId);

          const catchup: SyncCatchup = {
            currentServerSeq,
            currentVector,
            missedOps,
            unresolvedConflicts
          };

          this.network.send('SERVER', msg.sender, 'CATCHUP', catchup);
          break;
        }

        case 'RESOLVE_CONFLICT': {
          const payload: ConflictResolutionPayload = msg.payload;
          const result = this.repo.resolveConflict(this.projectId, msg.sender, payload);

          // Send ack back to submitter
          this.network.send('SERVER', msg.sender, 'ACK_OPS', { acks: [result.ack] });

          // Broadcast conflict-resolved & resolutionOp to all replicas
          if (result.resolutionOp) {
            for (const [replicaId] of this.replicas.entries()) {
              this.network.send('SERVER', replicaId, 'CONFLICT_RESOLVED', {
                conflictId: payload.conflictId,
                resolutionOp: result.resolutionOp
              });
              if (replicaId !== msg.sender) {
                this.network.send('SERVER', replicaId, 'BROADCAST_OPS', {
                  operations: [result.resolutionOp]
                });
              }
            }
          }
          break;
        }
      }
    });
  }
}
