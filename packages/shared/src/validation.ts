/**
 * NexusSync Runtime Validation Utilities
 * Validates incoming sync operations, handshakes, and batches at runtime.
 */

import type {
  SyncOperation,
  SyncHandshake,
  OperationType,
  UpdatableTaskField,
  TaskStatus,
  TaskPriority
} from './types.js';

export const MAX_BATCH_SIZE = 50;
export const MAX_PAYLOAD_BYTES = 65536; // 64 KB per op

const VALID_OP_TYPES: Set<OperationType> = new Set([
  'TASK_CREATE',
  'TASK_UPDATE_FIELD',
  'TASK_DELETE',
  'DEPENDENCY_ADD',
  'DEPENDENCY_REMOVE',
  'CONFLICT_RESOLVE'
]);

const VALID_TASK_STATUSES: Set<TaskStatus> = new Set(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);
const VALID_TASK_PRIORITIES: Set<TaskPriority> = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const VALID_UPDATABLE_FIELDS: Set<UpdatableTaskField> = new Set([
  'title',
  'description',
  'status',
  'priority',
  'dueDate'
]);

const VALID_RESOLUTION_STRATEGIES = new Set([
  'CHOOSE_A',
  'CHOOSE_B',
  'MERGE_CUSTOM',
  'MEMORY_APPLIED'
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a single SyncOperation structure and typed payload at runtime.
 */
export function validateSyncOperation(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Operation must be a non-null object' };
  }

  const op = raw as Record<string, unknown>;

  // Check payload size
  try {
    const serialized = JSON.stringify(op);
    if (serialized.length > MAX_PAYLOAD_BYTES) {
      return { valid: false, error: `Operation exceeds maximum size of ${MAX_PAYLOAD_BYTES} bytes` };
    }
  } catch {
    return { valid: false, error: 'Operation cannot be serialized to JSON' };
  }

  // opId validation
  if (typeof op.opId !== 'string' || op.opId.trim().length === 0 || op.opId.length > 128) {
    return { valid: false, error: 'opId must be a non-empty string with length <= 128' };
  }

  // projectId validation
  if (typeof op.projectId !== 'string' || op.projectId.trim().length === 0 || op.projectId.length > 128) {
    return { valid: false, error: 'projectId must be a non-empty string with length <= 128' };
  }

  // entityId validation
  if (typeof op.entityId !== 'string' || op.entityId.trim().length === 0 || op.entityId.length > 128) {
    return { valid: false, error: 'entityId must be a non-empty string with length <= 128' };
  }

  // replicaId validation
  if (typeof op.replicaId !== 'string' || op.replicaId.trim().length === 0 || op.replicaId.length > 128) {
    return { valid: false, error: 'replicaId must be a non-empty string with length <= 128' };
  }

  // clientSeq validation
  if (typeof op.clientSeq !== 'number' || !Number.isInteger(op.clientSeq) || op.clientSeq < 1) {
    return { valid: false, error: 'clientSeq must be a positive integer >= 1' };
  }

  // serverSeq validation (must be null or positive integer)
  if (op.serverSeq !== null && (typeof op.serverSeq !== 'number' || !Number.isInteger(op.serverSeq) || op.serverSeq < 0)) {
    return { valid: false, error: 'serverSeq must be null or integer >= 0' };
  }

  // lamportTime validation
  if (typeof op.lamportTime !== 'number' || !Number.isInteger(op.lamportTime) || op.lamportTime < 0) {
    return { valid: false, error: 'lamportTime must be an integer >= 0' };
  }

  // timestamp validation
  if (typeof op.timestamp !== 'number' || op.timestamp <= 0) {
    return { valid: false, error: 'timestamp must be a positive physical epoch number' };
  }

  // versionVector validation
  if (!op.versionVector || typeof op.versionVector !== 'object' || Array.isArray(op.versionVector)) {
    return { valid: false, error: 'versionVector must be a valid Record<string, number> object' };
  }
  for (const [key, val] of Object.entries(op.versionVector)) {
    if (typeof key !== 'string' || key.trim().length === 0 || typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
      return { valid: false, error: `Invalid entry in versionVector for key '${key}'` };
    }
  }

  // type validation
  if (typeof op.type !== 'string' || !VALID_OP_TYPES.has(op.type as OperationType)) {
    return { valid: false, error: `Invalid operation type: '${String(op.type)}'` };
  }

  // payload validation
  if (!op.payload || typeof op.payload !== 'object' || Array.isArray(op.payload)) {
    return { valid: false, error: 'payload must be a non-null object' };
  }

  const payload = op.payload as Record<string, unknown>;

  switch (op.type) {
    case 'TASK_CREATE': {
      if (typeof payload.title !== 'string' || payload.title.trim().length === 0 || payload.title.length > 256) {
        return { valid: false, error: 'TASK_CREATE: title must be a non-empty string <= 256 characters' };
      }
      if (typeof payload.description !== 'string') {
        return { valid: false, error: 'TASK_CREATE: description must be a string' };
      }
      if (!VALID_TASK_STATUSES.has(payload.status as TaskStatus)) {
        return { valid: false, error: `TASK_CREATE: invalid status '${String(payload.status)}'` };
      }
      if (!VALID_TASK_PRIORITIES.has(payload.priority as TaskPriority)) {
        return { valid: false, error: `TASK_CREATE: invalid priority '${String(payload.priority)}'` };
      }
      if (payload.dueDate !== null && typeof payload.dueDate !== 'string') {
        return { valid: false, error: 'TASK_CREATE: dueDate must be an ISO string or null' };
      }
      if (!Array.isArray(payload.dependencies)) {
        return { valid: false, error: 'TASK_CREATE: dependencies must be an array' };
      }
      break;
    }

    case 'TASK_UPDATE_FIELD': {
      if (!VALID_UPDATABLE_FIELDS.has(payload.field as UpdatableTaskField)) {
        return { valid: false, error: `TASK_UPDATE_FIELD: invalid field '${String(payload.field)}'` };
      }
      if (payload.entityId !== op.entityId) {
        return { valid: false, error: 'TASK_UPDATE_FIELD: payload.entityId does not match op.entityId' };
      }
      break;
    }

    case 'TASK_DELETE': {
      if (payload.entityId !== op.entityId) {
        return { valid: false, error: 'TASK_DELETE: payload.entityId does not match op.entityId' };
      }
      break;
    }

    case 'DEPENDENCY_ADD':
    case 'DEPENDENCY_REMOVE': {
      if (typeof payload.taskId !== 'string' || typeof payload.dependsOnTaskId !== 'string') {
        return { valid: false, error: `${op.type}: taskId and dependsOnTaskId must be strings` };
      }
      if (payload.taskId === payload.dependsOnTaskId) {
        return { valid: false, error: `${op.type}: self-dependency not allowed` };
      }
      break;
    }

    case 'CONFLICT_RESOLVE': {
      if (typeof payload.conflictId !== 'string' || payload.conflictId.trim().length === 0) {
        return { valid: false, error: 'CONFLICT_RESOLVE: conflictId must be a non-empty string' };
      }
      if (typeof payload.resolutionStrategy !== 'string') {
        return { valid: false, error: 'CONFLICT_RESOLVE: resolutionStrategy must be a string' };
      }
      break;
    }
  }

  return { valid: true };
}

/**
 * Validates a client handshake payload.
 */
export function validateHandshake(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Handshake payload must be a non-null object' };
  }

  const data = raw as Record<string, unknown>;

  if (typeof data.projectId !== 'string' || data.projectId.trim().length === 0 || data.projectId.length > 128) {
    return { valid: false, error: 'projectId must be a non-empty string <= 128 characters' };
  }

  if (typeof data.replicaId !== 'string' || data.replicaId.trim().length === 0 || data.replicaId.length > 128) {
    return { valid: false, error: 'replicaId must be a non-empty string <= 128 characters' };
  }

  if (typeof data.lastServerSeq !== 'number' || !Number.isInteger(data.lastServerSeq) || data.lastServerSeq < 0) {
    return { valid: false, error: 'lastServerSeq must be an integer >= 0' };
  }

  if (!data.knownVector || typeof data.knownVector !== 'object' || Array.isArray(data.knownVector)) {
    return { valid: false, error: 'knownVector must be an object Record<string, number>' };
  }

  return { valid: true };
}

/**
 * Validates an incoming push-ops batch.
 */
export function validateBatch(operations: unknown, maxBatchSize = MAX_BATCH_SIZE): ValidationResult {
  if (!Array.isArray(operations)) {
    return { valid: false, error: 'Operations payload must be an array' };
  }

  if (operations.length === 0) {
    return { valid: false, error: 'Operations array cannot be empty' };
  }

  if (operations.length > maxBatchSize) {
    return { valid: false, error: `Batch size (${operations.length}) exceeds maximum limit of ${maxBatchSize}` };
  }

  return { valid: true };
}

/**
 * Compares two operations to determine if they are identical in immutable content.
 * Used for strict idempotency verification (rejects conflicting opId reuse).
 */
export function isIdenticalOperation(op1: SyncOperation, op2: SyncOperation): boolean {
  if (
    op1.opId !== op2.opId ||
    op1.projectId !== op2.projectId ||
    op1.entityId !== op2.entityId ||
    op1.type !== op2.type ||
    op1.replicaId !== op2.replicaId ||
    op1.clientSeq !== op2.clientSeq
  ) {
    return false;
  }

  return JSON.stringify(op1.payload) === JSON.stringify(op2.payload);
}

/**
 * Validates a conflict resolution payload.
 */
export function validateConflictResolutionPayload(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Resolution payload must be a non-null object' };
  }

  const data = raw as Record<string, unknown>;

  if (typeof data.conflictId !== 'string' || data.conflictId.trim().length === 0 || data.conflictId.length > 128) {
    return { valid: false, error: 'conflictId must be a non-empty string <= 128 characters' };
  }

  if (typeof data.entityId !== 'string' || data.entityId.trim().length === 0 || data.entityId.length > 128) {
    return { valid: false, error: 'entityId must be a non-empty string <= 128 characters' };
  }

  if (typeof data.resolutionStrategy !== 'string' || !VALID_RESOLUTION_STRATEGIES.has(data.resolutionStrategy)) {
    return { valid: false, error: `Invalid resolutionStrategy: '${String(data.resolutionStrategy)}'` };
  }

  if (!data.resolvedFields || typeof data.resolvedFields !== 'object' || Array.isArray(data.resolvedFields)) {
    return { valid: false, error: 'resolvedFields must be a non-null object' };
  }

  const fields = data.resolvedFields as Record<string, unknown>;
  for (const field of Object.keys(fields)) {
    if (!VALID_UPDATABLE_FIELDS.has(field as UpdatableTaskField)) {
      return { valid: false, error: `Field '${field}' in resolvedFields is not an updatable task field` };
    }
  }

  if (typeof data.rememberDecision !== 'boolean') {
    return { valid: false, error: 'rememberDecision must be a boolean' };
  }

  return { valid: true };
}

/**
 * Validates the raw JSON output produced by the AI Conflict Advisor model.
 * Enforces:
 * 1. Non-null object with bounded size
 * 2. explanation string
 * 3. suggestions array (at least 1 suggestion, max 5)
 * 4. Each suggestion must have valid strategy, confidence (0.0 to 1.0), and non-empty rationale
 * 5. risks array of strings
 * 6. requiresHumanApproval must strictly be true
 */
export function validateConflictAdvisorOutput(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Advisor output must be a non-null object' };
  }

  const data = raw as Record<string, unknown>;

  if (typeof data.explanation !== 'string' || data.explanation.trim().length === 0) {
    return { valid: false, error: 'explanation must be a non-empty string' };
  }
  if (data.explanation.length > 5000) {
    return { valid: false, error: 'explanation exceeds maximum length of 5000 characters' };
  }

  if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
    return { valid: false, error: 'suggestions must be a non-empty array' };
  }
  if (data.suggestions.length > 5) {
    return { valid: false, error: 'suggestions array cannot exceed 5 items' };
  }

  const validStrategies = new Set(['CHOOSE_A', 'CHOOSE_B', 'MERGE_CUSTOM', 'MEMORY_APPLIED']);

  for (let i = 0; i < data.suggestions.length; i++) {
    const s = data.suggestions[i];
    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      return { valid: false, error: `suggestion at index ${i} must be an object` };
    }
    const sug = s as Record<string, unknown>;
    if (typeof sug.strategy !== 'string' || !validStrategies.has(sug.strategy)) {
      return { valid: false, error: `suggestion at index ${i} has invalid strategy: '${String(sug.strategy)}'` };
    }
    if (typeof sug.confidence !== 'number' || Number.isNaN(sug.confidence) || sug.confidence < 0 || sug.confidence > 1) {
      return { valid: false, error: `suggestion at index ${i} confidence must be a number between 0.0 and 1.0` };
    }
    if (typeof sug.rationale !== 'string' || sug.rationale.trim().length === 0) {
      return { valid: false, error: `suggestion at index ${i} rationale must be a non-empty string` };
    }
    if (sug.rationale.length > 2000) {
      return { valid: false, error: `suggestion at index ${i} rationale exceeds maximum length of 2000 characters` };
    }
    if (sug.suggestedValue === undefined) {
      return { valid: false, error: `suggestion at index ${i} must include suggestedValue` };
    }
  }

  if (!Array.isArray(data.risks)) {
    return { valid: false, error: 'risks must be an array of strings' };
  }
  for (let i = 0; i < data.risks.length; i++) {
    if (typeof data.risks[i] !== 'string') {
      return { valid: false, error: `risk at index ${i} must be a string` };
    }
    if ((data.risks[i] as string).length > 1000) {
      return { valid: false, error: `risk at index ${i} exceeds maximum length of 1000 characters` };
    }
  }

  if (data.requiresHumanApproval !== true) {
    return { valid: false, error: 'requiresHumanApproval must strictly be boolean true' };
  }

  return { valid: true };
}
