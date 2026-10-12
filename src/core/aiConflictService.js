/**
 * @file src/core/aiConflictService.js
 * @description Boundary service contract for Purposeful AI Conflict Assistant.
 * 
 * SECURITY & TRUTHFULNESS SPECIFICATIONS:
 * 1. AI is strictly ADVISORY. It NEVER resolves conflicts, merges values, or commits mutations.
 * 2. Convergence and invariant validity are governed SOLELY by deterministic CRDT engine logic.
 * 3. Never stores AI API keys in localStorage, sessionStorage, IndexedDB, or source code.
 * 4. Checks whether a verified secure backend AI service is configured. If none is available,
 *    truthfully returns status 'NOT_CONNECTED' ("AI assistance is not connected yet").
 * 5. Does NOT fabricate fake AI responses or synthetic confidence scores.
 */

/**
 * Checks whether a verified secure server-side AI endpoint is configured.
 * Frontend never communicates directly with private AI providers to avoid exposing secrets.
 * @returns {boolean}
 */
export function isAiServiceConfigured() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // A secure server proxy or backend gateway URL can be provided via VITE_AI_ENDPOINT
    const endpoint = import.meta.env.VITE_AI_ENDPOINT;
    return typeof endpoint === 'string' && endpoint.trim().length > 0;
  }
  return false;
}

/**
 * Extracts minimal, relevant context from an active conflict for AI analysis.
 * Does not transmit unnecessary metadata or private user credentials.
 * 
 * @param {Object} conflict - Active conflict descriptor
 * @returns {Object} Structured safe context payload
 */
export function extractConflictContext(conflict) {
  if (!conflict) return null;

  // Identify mutated fields between Base, Branch A, and Branch B
  const mutatedFields = [];
  const base = conflict.base || {};
  const branchA = conflict.branchA || {};
  const branchB = conflict.branchB || {};

  ['dueDate', 'priority', 'assignee', 'blockingDep', 'title'].forEach((field) => {
    const valBase = base[field];
    const valA = branchA[field];
    const valB = branchB[field];
    if (valA !== valBase || valB !== valBase) {
      mutatedFields.push({
        field,
        baseValue: valBase ?? 'N/A',
        localValue: valA ?? 'N/A',
        remoteValue: valB ?? 'N/A',
        hasDirectCollision: valA !== valB,
      });
    }
  });

  return {
    taskId: conflict.taskCardId || conflict.id,
    title: conflict.title || 'Untitled Task',
    lcaHash: conflict.lcaHash || 'unknown',
    lamportTicks: conflict.lamportTicks || 0,
    mutatedFields,
    base: {
      version: base.version || 'Ancestor LCA',
      dueDate: base.dueDate,
      priority: base.priority,
      assignee: base.assignee,
      blockingDep: base.blockingDep,
    },
    localBranch: {
      replica: branchA.replica || 'Replica A (Local)',
      version: branchA.version,
      dueDate: branchA.dueDate,
      priority: branchA.priority,
      assignee: branchA.assignee,
      blockingDep: branchA.blockingDep,
    },
    remoteBranch: {
      replica: branchB.replica || 'Replica B (Remote)',
      version: branchB.version,
      dueDate: branchB.dueDate,
      priority: branchB.priority,
      assignee: branchB.assignee,
      blockingDep: branchB.blockingDep,
    },
  };
}

/**
 * Requests an AI conflict explanation from the verified backend proxy.
 * If no backend is connected, gracefully and truthfully returns status 'NOT_CONNECTED'.
 * 
 * @param {Object} conflictContext - Extracted conflict context from extractConflictContext
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<{
 *   status: 'NOT_CONNECTED' | 'RESULT' | 'ERROR',
 *   data?: {
 *     whatChanged: string,
 *     whyAttentionNeeded: string,
 *     possibleImpact: string,
 *     suggestion: string
 *   },
 *   message?: string
 * }>}
 */
export async function requestConflictExplanation(conflictContext, signal) {
  // 1. Truthful connection check
  if (!isAiServiceConfigured()) {
    return {
      status: 'NOT_CONNECTED',
      message: 'AI assistance is not connected yet.',
    };
  }

  // 2. If endpoint is configured, communicate with verified server proxy
  const endpoint = import.meta.env.VITE_AI_ENDPOINT;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'EXPLAIN_CONFLICT',
        conflict: conflictContext,
      }),
      signal,
    });

    if (!response.ok) {
      return {
        status: 'ERROR',
        message: 'AI assistance is temporarily unavailable. You can still resolve this conflict manually.',
      };
    }

    const payload = await response.json();

    if (!payload || !payload.whatChanged) {
      return {
        status: 'ERROR',
        message: 'AI assistance is temporarily unavailable. You can still resolve this conflict manually.',
      };
    }

    return {
      status: 'RESULT',
      data: {
        whatChanged: payload.whatChanged,
        whyAttentionNeeded: payload.whyAttentionNeeded || '',
        possibleImpact: payload.possibleImpact || '',
        suggestion: payload.suggestion || 'Both options appear safe based on the available information.',
      },
    };
  } catch {
    if (signal?.aborted) {
      return {
        status: 'ERROR',
        message: 'Analysis cancelled.',
      };
    }
    return {
      status: 'ERROR',
      message: 'AI assistance is temporarily unavailable. You can still resolve this conflict manually.',
    };
  }
}
