/**
 * NexusSync Socket.IO & REST Contract
 */

import type {
  SyncHandshake,
  SyncCatchup,
  SyncOperation,
  OperationAcknowledgement,
  ConflictRecord,
  ConflictResolutionPayload,
  WorkspaceSnapshot,
  SyncError
} from './types.js';

/**
 * Socket.IO Client-to-Server Events
 */
export interface ClientToServerEvents {
  'client:handshake': (
    data: SyncHandshake,
    callback?: (response: SyncCatchup | { error: SyncError }) => void
  ) => void;
  'client:push-ops': (
    data: { operations: SyncOperation[] },
    callback?: (response: { acks: OperationAcknowledgement[] } | { error: SyncError }) => void
  ) => void;
  'client:resolve-conflict': (
    data: ConflictResolutionPayload,
    callback?: (response: { ack: OperationAcknowledgement } | { error: SyncError }) => void
  ) => void;
}

/**
 * Socket.IO Server-to-Client Events
 */
export interface ServerToClientEvents {
  'server:catchup': (data: SyncCatchup) => void;
  'server:ack-ops': (data: { acks: OperationAcknowledgement[] }) => void;
  'server:broadcast-ops': (data: { operations: SyncOperation[] }) => void;
  'server:conflict-detected': (data: { conflict: ConflictRecord }) => void;
  'server:conflict-resolved': (data: {
    conflictId: string;
    resolutionOp: SyncOperation;
  }) => void;
  'server:error': (data: SyncError) => void;
}

/**
 * Socket.IO Inter-Server Events
 */
export interface InterServerEvents {
  ping: () => void;
}

/**
 * Socket.IO Socket Data
 */
export interface SocketData {
  replicaId: string;
  projectId: string;
}

/**
 * REST API Responses
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  db: {
    connected: boolean;
    walMode: boolean;
  };
  serverSeq: number;
}

export interface WorkspaceSnapshotResponse {
  success: boolean;
  data: WorkspaceSnapshot;
  error?: string;
}
