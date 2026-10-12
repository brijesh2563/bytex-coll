/**
 * @file src/types/index.js
 * @description Authoritative JSDoc typedefs for NexusSync.
 * Sourced directly from docs/ARCHITECTURE.md.
 */

/**
 * @typedef {'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'} TaskStatus
 * @typedef {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'} TaskPriority
 */

/**
 * @typedef {Object} Task
 * @property {string} id - Unique task identifier e.g. "task_01j7..."
 * @property {string} title - Task title
 * @property {string} description - Detailed description
 * @property {TaskStatus} status - Task completion status
 * @property {TaskPriority} priority - Priority level
 * @property {string|null} assignedTo - Assignee name or replica ID
 * @property {string|null} dueDate - ISO Date string e.g. "2026-10-14"
 * @property {string[]} dependencies - Task IDs that must be DONE before this task
 * @property {number} version - Entity logical version
 * @property {number} updatedAt - UTC Epoch milliseconds
 */

/**
 * @typedef {Object} WorkspaceDocument
 * @property {string} id - Workspace document ID
 * @property {number} version - Document logical version
 * @property {number} serverSeq - Canonical server sequence
 * @property {Record<string, Task>} tasks - Map of TaskId -> Task
 * @property {string[]} deletedTaskIds - Tombstoned task IDs
 * @property {number} updatedAt - UTC Epoch milliseconds
 */

/**
 * @typedef {'TASK_CREATE' | 'TASK_UPDATE_FIELD' | 'TASK_DELETE' | 'TASK_ADD_DEPENDENCY' | 'TASK_REMOVE_DEPENDENCY' | 'RESOLUTION_APPLY'} OpType
 */

/**
 * @typedef {Object} CausalMetadata
 * @property {string} replicaId - Originating replica ID
 * @property {number} opSeq - Monotonic local sequence counter per replica
 * @property {number} lamportClock - Lamport logical timestamp
 * @property {number} baseVersion - Document version observed when mutation originated
 * @property {string[]} dependencies - Immediate predecessor operation IDs
 */

/**
 * @typedef {Object} Operation
 * @property {string} id - Operation ID in format `${replicaId}:${opSeq}`
 * @property {string} documentId - Target workspace document ID
 * @property {OpType} type - Operation action type
 * @property {any} payload - Action-specific payload
 * @property {CausalMetadata} meta - Causal vector metadata
 * @property {number} createdAt - UTC Epoch milliseconds
 * @property {number} [serverSeq] - Canonical server sequence (assigned upon server commit)
 */

/**
 * @typedef {'CONCURRENT_FIELD_EDIT' | 'SEMANTIC_INVARIANT_VIOLATION' | 'CIRCULAR_DEPENDENCY' | 'DELETE_UPDATE_COLLISION'} ConflictType
 * @typedef {'AUTO_MERGEABLE' | 'REQUIRES_USER_INTERVENTION'} ConflictSeverity
 */

/**
 * @typedef {Object} SuggestedResolution
 * @property {boolean} approvedBefore - Whether this rule was approved in memory before
 * @property {any} chosenValue - Suggested resolution value
 * @property {number} confidence - Heuristic score (0.0 to 1.0)
 * @property {string} ruleKey - Deterministic hash signature
 */

/**
 * @typedef {Object} ConflictDescriptor
 * @property {string} conflictId - Unique conflict identifier
 * @property {string} documentId - Document ID
 * @property {string} taskId - Target task ID
 * @property {ConflictType} type - Category of conflict
 * @property {ConflictSeverity} severity - Auto-mergeable or needs human
 * @property {any} baseValue - Original value before concurrent divergent branches
 * @property {Operation[]} competingOperations - Competing operations
 * @property {string} [invariantBroken] - Explanation of broken domain rule
 * @property {SuggestedResolution} [suggestedResolution] - Adaptive memory suggestion
 * @property {number} detectedAt - UTC Epoch milliseconds
 */

/**
 * @typedef {Object} ConflictResolution
 * @property {string} conflictId - Target conflict ID
 * @property {string} documentId - Target document ID
 * @property {string} resolvedTaskId - Target task ID
 * @property {'PICK_CLIENT_A' | 'PICK_CLIENT_B' | 'CUSTOM_MERGE'} strategy
 * @property {any} finalValue - User-approved resolution state
 * @property {boolean} rememberRule - Store in adaptive resolution memory
 * @property {string} resolvedByReplica - Submitter replica ID
 * @property {number} resolvedAt - UTC Epoch milliseconds
 */

/**
 * @typedef {'ONLINE' | 'OFFLINE' | 'RECONNECTING' | 'SYNCING'} ConnectionState
 * @typedef {'SYNCED' | 'DIVERGING' | 'CONFLICT' | 'CONVERGING' | 'LOCKED'} DialState
 */

/**
 * Authoritative Socket.IO Event Names from docs/ARCHITECTURE.md
 */
export const SYNC_EVENTS = Object.freeze({
  HANDSHAKE: 'sync:handshake',
  HANDSHAKE_ACK: 'sync:handshake_ack',
  PUSH_OPS: 'sync:push_ops',
  OP_COMMITTED: 'sync:op_committed',
  CONFLICT_RAISED: 'sync:conflict_raised',
  RESOLVE_CONFLICT: 'sync:resolve_conflict',
});
