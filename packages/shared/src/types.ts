/**
 * NexusSync Core Types
 * Authoritative Shared Domain & Protocol Contract
 */

export type ReplicaId = string;
export type DocumentId = string;
export type EntityId = string;
export type OperationId = string;

/**
 * Causal Version Vector: Map of ReplicaId -> Monotonic Sequence Number
 */
export type VersionVector = Record<ReplicaId, number>;

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskEntity {
  id: EntityId;
  projectId: DocumentId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;           // ISO 8601 string or null
  dependencies: EntityId[];         // Prerequisite task IDs
  version: number;                  // Local mutation counter
  updatedAt: string;                // ISO 8601 timestamp
  isDeleted: boolean;
}

export type OperationType =
  | 'TASK_CREATE'
  | 'TASK_UPDATE_FIELD'
  | 'TASK_DELETE'
  | 'DEPENDENCY_ADD'
  | 'DEPENDENCY_REMOVE'
  | 'CONFLICT_RESOLVE';

export interface TaskCreatePayload {
  entityId: EntityId;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  dependencies: EntityId[];
}

export type UpdatableTaskField = 'title' | 'description' | 'status' | 'priority' | 'dueDate';

export interface TaskUpdateFieldPayload {
  entityId: EntityId;
  field: UpdatableTaskField;
  oldValue: unknown;
  newValue: unknown;
}

export interface TaskDeletePayload {
  entityId: EntityId;
}

export interface DependencyPayload {
  taskId: EntityId;
  dependsOnTaskId: EntityId;
}

export type ResolutionStrategy =
  | 'CHOOSE_A'
  | 'CHOOSE_B'
  | 'MERGE_CUSTOM'
  | 'MEMORY_APPLIED';

export interface ConflictResolutionPayload {
  conflictId: string;
  entityId: EntityId;
  resolutionStrategy: ResolutionStrategy;
  resolvedFields: Partial<Pick<TaskEntity, UpdatableTaskField>>;
  rememberDecision: boolean;
}

export type OperationPayloadMap = {
  TASK_CREATE: TaskCreatePayload;
  TASK_UPDATE_FIELD: TaskUpdateFieldPayload;
  TASK_DELETE: TaskDeletePayload;
  DEPENDENCY_ADD: DependencyPayload;
  DEPENDENCY_REMOVE: DependencyPayload;
  CONFLICT_RESOLVE: ConflictResolutionPayload;
};

/**
 * Discriminated Union for Atomic Sync Operation
 */
export type SyncOperation = {
  [K in OperationType]: {
    opId: OperationId;
    projectId: DocumentId;
    entityId: EntityId;
    type: K;
    payload: OperationPayloadMap[K];
    replicaId: ReplicaId;
    clientSeq: number;
    serverSeq: number | null;
    lamportTime: number;
    versionVector: VersionVector;
    timestamp: number;
  };
}[OperationType];

export type ConflictType =
  | 'CONCURRENT_FIELD_COLLISION'
  | 'DELETE_UPDATE_COLLISION'
  | 'DEPENDENCY_CYCLE'
  | 'INVALID_DUE_DATE_ORDER'
  | 'STATUS_PREREQUISITE_VIOLATED';

export type ConflictStatus = 'UNRESOLVED' | 'RESOLVED' | 'AUTO_MERGED';

export interface ConflictingBranch {
  replicaId: ReplicaId;
  opId: OperationId;
  value: unknown;
  timestamp: number;
}

export interface ResolutionSuggestion {
  suggestedValue: unknown;
  confidence: number;              // 0.0 to 1.0
  rationale: string;
  memoryRuleId?: string;
}

export interface ConflictRecord {
  conflictId: string;
  projectId: DocumentId;
  entityId: EntityId;
  type: ConflictType;
  field?: UpdatableTaskField;
  status: ConflictStatus;
  branchA: ConflictingBranch;
  branchB: ConflictingBranch;
  suggestedResolution?: ResolutionSuggestion;
  resolvedAt?: string;
  resolvedBy?: ReplicaId;
  winningValue?: unknown;
}

export interface ConflictResolution {
  conflictId: string;
  projectId: DocumentId;
  entityId: EntityId;
  resolvedBy: ReplicaId;
  resolvedAt: string;
  resolutionStrategy: ResolutionStrategy;
  winningValue: unknown;
  rememberDecision: boolean;
}

export type AckStatus = 'ACCEPTED' | 'REJECTED' | 'DUPLICATE_IGNORED';

export interface OperationAcknowledgement {
  opId: OperationId;
  serverSeq: number | null;
  status: AckStatus;
  reason?: string;
}

export interface SyncHandshake {
  replicaId: ReplicaId;
  projectId: DocumentId;
  knownVector: VersionVector;
  lastServerSeq: number;
}

export interface SyncCatchup {
  currentServerSeq: number;
  currentVector: VersionVector;
  missedOps: SyncOperation[];
  unresolvedConflicts: ConflictRecord[];
}

export interface SyncError {
  code: string;
  message: string;
  opId?: OperationId;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface WorkspaceSnapshot {
  projectId: DocumentId;
  serverSeq: number;
  versionVector: VersionVector;
  tasks: TaskEntity[];
  unresolvedConflicts: ConflictRecord[];
}

/**
 * AI Conflict Advisor Types (Ollama Cloud)
 * Advisory only - non-mutating schema for intelligent resolution recommendations.
 */
export interface ConflictAdvisorSuggestion {
  strategy: ResolutionStrategy;
  suggestedValue: unknown;
  confidence: number; // 0.0 to 1.0
  rationale: string;
}

export interface ConflictAdvisorAnalysis {
  conflictId: string;
  projectId: DocumentId;
  entityId: EntityId;
  field?: UpdatableTaskField;
  explanation: string;
  suggestions: ConflictAdvisorSuggestion[];
  risks: string[];
  requiresHumanApproval: true;
  modelUsed: string;
  analyzedAt: string;
}

export interface ConflictAdvisorResponse {
  success: boolean;
  data?: ConflictAdvisorAnalysis;
  error?: string;
  code?: string;
}
