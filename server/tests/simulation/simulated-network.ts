import { SeededRandom } from './seeded-random.js';

export interface NetworkMessage {
  id: string;
  sender: string;
  recipient: string;
  type:
    | 'PUSH_OPS'
    | 'ACK_OPS'
    | 'BROADCAST_OPS'
    | 'CONFLICT_DETECTED'
    | 'CONFLICT_RESOLVED'
    | 'HANDSHAKE'
    | 'CATCHUP'
    | 'RESOLVE_CONFLICT';
  payload: any;
}

export interface NetworkFaultConfig {
  dropRate?: number;
  duplicateRate?: number;
  reorderRate?: number;
  minDelayTicks?: number;
  maxDelayTicks?: number;
}

export interface ScheduledPacket {
  id: string;
  message: NetworkMessage;
  scheduledTick: number;
  originalScheduledTick: number;
  isDuplicate?: boolean;
}

export interface NetworkMetrics {
  sentCount: number;
  deliveredCount: number;
  droppedCount: number;
  duplicatedCount: number;
  reorderedCount: number;
}

export type MessageHandler = (message: NetworkMessage) => void;

/**
 * Deterministic In-Memory Discrete-Event Simulation Network
 */
export class SimulatedNetwork {
  private currentTick = 0;
  private queue: ScheduledPacket[] = [];
  private handlers: Map<string, MessageHandler> = new Map();
  private disconnectedNodes: Set<string> = new Set();
  private partitionGroups: Set<string>[] = [];
  private faultConfig: NetworkFaultConfig;
  private rng: SeededRandom;
  private packetIdCounter = 0;

  public metrics: NetworkMetrics = {
    sentCount: 0,
    deliveredCount: 0,
    droppedCount: 0,
    duplicatedCount: 0,
    reorderedCount: 0
  };

  constructor(faultConfig: NetworkFaultConfig = {}, rng: SeededRandom = new SeededRandom()) {
    this.faultConfig = {
      dropRate: 0,
      duplicateRate: 0,
      reorderRate: 0,
      minDelayTicks: 1,
      maxDelayTicks: 1,
      ...faultConfig
    };
    this.rng = rng;
  }

  public registerNode(nodeId: string, handler: MessageHandler): void {
    this.handlers.set(nodeId, handler);
  }

  public unregisterNode(nodeId: string): void {
    this.handlers.delete(nodeId);
  }

  public setFaultConfig(config: Partial<NetworkFaultConfig>): void {
    this.faultConfig = { ...this.faultConfig, ...config };
  }

  public getCurrentTick(): number {
    return this.currentTick;
  }

  public disconnect(nodeId: string): void {
    this.disconnectedNodes.add(nodeId);
  }

  public reconnect(nodeId: string): void {
    this.disconnectedNodes.delete(nodeId);
  }

  public isNodeConnected(nodeId: string): boolean {
    return !this.disconnectedNodes.has(nodeId);
  }

  public partition(groups: string[][]): void {
    this.partitionGroups = groups.map((g) => new Set(g));
  }

  public healPartitions(): void {
    this.partitionGroups = [];
  }

  private canCommunicate(sender: string, recipient: string): boolean {
    if (this.disconnectedNodes.has(sender) || this.disconnectedNodes.has(recipient)) {
      return false;
    }

    if (this.partitionGroups.length > 0) {
      const senderGroup = this.partitionGroups.find((g) => g.has(sender));
      const recipientGroup = this.partitionGroups.find((g) => g.has(recipient));

      if (senderGroup && recipientGroup && senderGroup !== recipientGroup) {
        return false;
      }
    }

    return true;
  }

  /**
   * Schedules a message for delivery across the simulated network.
   */
  public send(
    sender: string,
    recipient: string,
    type: NetworkMessage['type'],
    payload: any,
    options?: { bypassFaults?: boolean; delayTicks?: number }
  ): void {
    this.metrics.sentCount++;
    const messageId = `msg-${++this.packetIdCounter}`;
    const message: NetworkMessage = {
      id: messageId,
      sender,
      recipient,
      type,
      payload
    };

    // Partition or disconnect drop
    if (!this.canCommunicate(sender, recipient)) {
      this.metrics.droppedCount++;
      return;
    }

    if (!options?.bypassFaults && this.faultConfig.dropRate && this.faultConfig.dropRate > 0) {
      if (this.rng.nextBool(this.faultConfig.dropRate)) {
        this.metrics.droppedCount++;
        return;
      }
    }

    const minDelay = options?.delayTicks ?? this.faultConfig.minDelayTicks ?? 1;
    const maxDelay = options?.delayTicks ?? this.faultConfig.maxDelayTicks ?? 1;
    let delay = this.rng.nextInt(minDelay, maxDelay);

    // Reordering jitter
    if (!options?.bypassFaults && this.faultConfig.reorderRate && this.faultConfig.reorderRate > 0) {
      if (this.rng.nextBool(this.faultConfig.reorderRate)) {
        delay += this.rng.nextInt(1, 5);
        this.metrics.reorderedCount++;
      }
    }

    const scheduledTick = this.currentTick + Math.max(1, delay);

    this.queue.push({
      id: messageId,
      message,
      scheduledTick,
      originalScheduledTick: scheduledTick
    });

    // Duplicate message injection
    if (!options?.bypassFaults && this.faultConfig.duplicateRate && this.faultConfig.duplicateRate > 0) {
      if (this.rng.nextBool(this.faultConfig.duplicateRate)) {
        this.metrics.duplicatedCount++;
        const dupDelay = delay + this.rng.nextInt(1, 3);
        this.queue.push({
          id: `${messageId}-dup`,
          message: { ...message, id: `${messageId}-dup` },
          scheduledTick: this.currentTick + Math.max(1, dupDelay),
          originalScheduledTick: this.currentTick + Math.max(1, dupDelay),
          isDuplicate: true
        });
      }
    }
  }

  /**
   * Advances simulation by one or more ticks and delivers ready packets.
   */
  public step(ticks = 1): number {
    let deliveredInStep = 0;

    for (let t = 0; t < ticks; t++) {
      this.currentTick++;

      // Extract packets scheduled for currentTick or earlier
      const readyIndices: number[] = [];
      for (let i = 0; i < this.queue.length; i++) {
        if (this.queue[i].scheduledTick <= this.currentTick) {
          readyIndices.push(i);
        }
      }

      if (readyIndices.length === 0) continue;

      // Extract packets in reverse to splice cleanly
      const readyPackets: ScheduledPacket[] = [];
      for (let i = readyIndices.length - 1; i >= 0; i--) {
        const idx = readyIndices[i];
        readyPackets.unshift(this.queue[idx]);
        this.queue.splice(idx, 1);
      }

      for (const packet of readyPackets) {
        // Re-check partition / disconnect state at delivery time
        if (!this.canCommunicate(packet.message.sender, packet.message.recipient)) {
          this.metrics.droppedCount++;
          continue;
        }

        const handler = this.handlers.get(packet.message.recipient);
        if (handler) {
          handler(packet.message);
          this.metrics.deliveredCount++;
          deliveredInStep++;
        }
      }
    }

    return deliveredInStep;
  }

  /**
   * Runs the network simulation until the event queue is empty or maxTicks reached.
   */
  public runUntilEmpty(maxTicks = 2000): number {
    let steps = 0;
    while (this.queue.length > 0 && steps < maxTicks) {
      this.step(1);
      steps++;
    }

    if (this.queue.length > 0) {
      throw new Error(`Simulation exceeded maxTicks (${maxTicks}) with ${this.queue.length} packets pending in queue`);
    }

    return steps;
  }

  public getPendingPacketCount(): number {
    return this.queue.length;
  }
}
