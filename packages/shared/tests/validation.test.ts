import { describe, it, expect } from 'vitest';
import {
  validateSyncOperation,
  validateHandshake,
  validateBatch,
  isIdenticalOperation,
  validateConflictResolutionPayload,
  validateConflictAdvisorOutput
} from '../src/validation.js';
import type { SyncOperation } from '../src/types.js';

describe('Runtime Validation Utilities', () => {
  const validOp: SyncOperation = {
    opId: 'op-1',
    projectId: 'proj-1',
    entityId: 'task-1',
    type: 'TASK_CREATE',
    payload: {
      entityId: 'task-1',
      title: 'Setup Database',
      description: 'Setup SQLite in WAL mode',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: null,
      dependencies: []
    },
    replicaId: 'client-A',
    clientSeq: 1,
    serverSeq: null,
    lamportTime: 1,
    versionVector: { 'client-A': 1 },
    timestamp: 1773000000000
  };

  it('validates a correct SyncOperation successfully', () => {
    const res = validateSyncOperation(validOp);
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('rejects an operation with missing required fields', () => {
    const invalid = { ...validOp, opId: '' };
    const res = validateSyncOperation(invalid);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/opId/);
  });

  it('rejects an invalid operation type', () => {
    const invalid = { ...validOp, type: 'UNKNOWN_TYPE' as any };
    const res = validateSyncOperation(invalid);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Invalid operation type/);
  });

  it('rejects an invalid client sequence number', () => {
    const invalid = { ...validOp, clientSeq: 0 };
    const res = validateSyncOperation(invalid);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/clientSeq must be a positive integer/);
  });

  it('validates client handshake payload', () => {
    const handshake = {
      replicaId: 'client-A',
      projectId: 'proj-1',
      knownVector: { 'client-A': 1 },
      lastServerSeq: 0
    };
    expect(validateHandshake(handshake).valid).toBe(true);

    const invalidHandshake = { ...handshake, lastServerSeq: -1 };
    expect(validateHandshake(invalidHandshake).valid).toBe(false);
  });

  it('enforces batch size limits', () => {
    expect(validateBatch([]).valid).toBe(false); // empty rejected
    expect(validateBatch([validOp]).valid).toBe(true);

    const largeBatch = Array.from({ length: 51 }, () => validOp);
    expect(validateBatch(largeBatch).valid).toBe(false);
  });

  it('detects identical content vs conflicting opId reuse', () => {
    const opCopy = JSON.parse(JSON.stringify(validOp));
    expect(isIdenticalOperation(validOp, opCopy)).toBe(true);

    const conflictingOp: SyncOperation = {
      ...validOp,
      payload: { ...validOp.payload, title: 'Completely Different Title' }
    };
    expect(isIdenticalOperation(validOp, conflictingOp)).toBe(false);
  });

  it('validates conflict resolution payloads', () => {
    const validResolution = {
      conflictId: 'conf-1',
      entityId: 'task-1',
      resolutionStrategy: 'CHOOSE_A',
      resolvedFields: { status: 'DONE' },
      rememberDecision: false
    };
    expect(validateConflictResolutionPayload(validResolution).valid).toBe(true);

    const invalidStrategy = { ...validResolution, resolutionStrategy: 'INVALID_STRATEGY' };
    expect(validateConflictResolutionPayload(invalidStrategy).valid).toBe(false);

    const invalidField = { ...validResolution, resolvedFields: { notAField: 'val' } };
    expect(validateConflictResolutionPayload(invalidField).valid).toBe(false);
  });

  it('validates AI Conflict Advisor output correctly', () => {
    const validAdvisorOutput = {
      explanation: 'Concurrent edits on priority field: client-A set HIGH while client-B set CRITICAL.',
      suggestions: [
        {
          strategy: 'CHOOSE_B',
          suggestedValue: 'CRITICAL',
          confidence: 0.9,
          rationale: 'CRITICAL priority preserves urgency in collaborative workflows.'
        }
      ],
      risks: ['May cause premature escalation if the task is not blocking.'],
      requiresHumanApproval: true
    };
    expect(validateConflictAdvisorOutput(validAdvisorOutput).valid).toBe(true);

    // Rejects missing explanation
    expect(validateConflictAdvisorOutput({ ...validAdvisorOutput, explanation: '' }).valid).toBe(false);

    // Rejects empty suggestions
    expect(validateConflictAdvisorOutput({ ...validAdvisorOutput, suggestions: [] }).valid).toBe(false);

    // Rejects invalid strategy
    expect(validateConflictAdvisorOutput({
      ...validAdvisorOutput,
      suggestions: [{ ...validAdvisorOutput.suggestions[0], strategy: 'INVALID' }]
    }).valid).toBe(false);

    // Rejects confidence out of bounds
    expect(validateConflictAdvisorOutput({
      ...validAdvisorOutput,
      suggestions: [{ ...validAdvisorOutput.suggestions[0], confidence: 1.5 }]
    }).valid).toBe(false);

    // Rejects requiresHumanApproval === false
    expect(validateConflictAdvisorOutput({ ...validAdvisorOutput, requiresHumanApproval: false }).valid).toBe(false);
  });
});
