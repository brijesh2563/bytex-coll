/**
 * NexusSync Real-Time Socket.IO & REST Sync Client
 *
 * Bridges the React frontend with the authoritative Express & Socket.IO backend.
 * Uses event names and schemas strictly adhering to @nexussync/shared.
 */

import { io } from 'socket.io-client';

const BACKEND_URL =
  (import.meta.env?.VITE_BACKEND_URL
    ? String(import.meta.env.VITE_BACKEND_URL).trim().replace(/\/+$/, '')
    : '') ||
  (typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  window.location.port !== '4000'
    ? 'http://localhost:4000'
    : '');

export const DEFAULT_PROJECT_ID = 'proj-observatory';

class SyncClient {
  constructor() {
    this.socket = null;
    this.status = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
    this.listeners = new Set();
    this.activeProjectId = DEFAULT_PROJECT_ID;
  }

  /**
   * Initializes or returns the existing Socket.IO connection.
   */
  init(baseUrl = BACKEND_URL) {
    if (this.socket) return this.socket;

    this.status = 'CONNECTING';
    this.notifyStatusChange();

    this.socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.status = 'CONNECTED';
      this.notifyStatusChange();
    });

    this.socket.on('disconnect', (reason) => {
      this.status = 'DISCONNECTED';
      this.notifyStatusChange(reason);
    });

    this.socket.on('connect_error', (error) => {
      this.status = 'ERROR';
      this.notifyStatusChange(error?.message || 'Connection error');
    });

    return this.socket;
  }

  onStatusChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyStatusChange(detail = null) {
    for (const listener of this.listeners) {
      try {
        listener(this.status, detail);
      } catch (err) {
        console.error('[SyncClient] Status listener error:', err);
      }
    }
  }

  get isConnected() {
    return this.socket?.connected === true;
  }

  /**
   * Performs the initial handshake and catch-up query.
   *
   * @param {Object} handshakeData
   * @param {string} handshakeData.replicaId
   * @param {string} handshakeData.projectId
   * @param {number} handshakeData.lastServerSeq
   * @param {Record<string, number>} handshakeData.knownVector
   * @returns {Promise<Object>} SyncCatchup response
   */
  handshake(handshakeData) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        return reject(new Error('Socket is not connected'));
      }

      const payload = {
        replicaId: handshakeData.replicaId,
        projectId: handshakeData.projectId || this.activeProjectId,
        lastServerSeq: Number.isInteger(handshakeData.lastServerSeq) ? handshakeData.lastServerSeq : 0,
        knownVector: handshakeData.knownVector || {},
      };

      this.socket.emit('client:handshake', payload, (response) => {
        if (!response) {
          return reject(new Error('Empty handshake acknowledgement from server'));
        }
        if (response.error) {
          return reject(new Error(response.error.message || 'Handshake rejected by server'));
        }
        resolve(response);
      });
    });
  }

  /**
   * Pushes a batch of operations to the backend coordinator.
   *
   * @param {Array<Object>} operations
   * @returns {Promise<{ acks: Array<Object> }>}
   */
  pushOperations(operations) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        return reject(new Error('Socket is not connected'));
      }

      if (!Array.isArray(operations) || operations.length === 0) {
        return resolve({ acks: [] });
      }

      this.socket.emit('client:push-ops', { operations }, (response) => {
        if (!response) {
          return reject(new Error('Empty push-ops acknowledgement from server'));
        }
        if (response.error) {
          return reject(new Error(response.error.message || 'Operation batch rejected by server'));
        }
        resolve(response);
      });
    });
  }

  /**
   * Submits an explicit human conflict resolution to the backend.
   *
   * @param {Object} resolutionPayload
   * @param {string} resolutionPayload.conflictId
   * @param {string} resolutionPayload.entityId
   * @param {string} resolutionPayload.resolutionStrategy
   * @param {Object} resolutionPayload.resolvedFields
   * @param {boolean} resolutionPayload.rememberDecision
   * @returns {Promise<Object>}
   */
  resolveConflict(resolutionPayload) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        return reject(new Error('Socket is not connected'));
      }

      this.socket.emit('client:resolve-conflict', resolutionPayload, (response) => {
        if (!response) {
          return reject(new Error('Empty resolve-conflict acknowledgement from server'));
        }
        if (response.error) {
          return reject(new Error(response.error.message || 'Conflict resolution rejected by server'));
        }
        resolve(response);
      });
    });
  }

  /**
   * Fetches the authoritative workspace snapshot via REST.
   */
  async fetchSnapshot(projectId = this.activeProjectId) {
    const base = BACKEND_URL || '';
    const res = await fetch(`${base}/api/v1/workspaces/${encodeURIComponent(projectId)}/snapshot`);
    if (!res.ok) {
      throw new Error(`Failed to fetch workspace snapshot: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json;
  }

  /**
   * Fetches the backend cluster health state via REST.
   */
  async fetchHealth() {
    const base = BACKEND_URL || '';
    const res = await fetch(`${base}/api/v1/health`);
    if (!res.ok) {
      throw new Error(`Failed to fetch cluster health: HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Queries the Ollama Cloud AI Conflict Advisor for analysis and non-mutating recommendations.
   *
   * @param {string} projectId
   * @param {string} conflictId
   * @returns {Promise<Object>} ConflictAdvisorResponse
   */
  async fetchConflictAdvice(projectId = this.activeProjectId, conflictId) {
    const base = BACKEND_URL || '';
    const url = `${base}/api/v1/workspaces/${encodeURIComponent(projectId)}/conflicts/${encodeURIComponent(conflictId)}/advise`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(body.error || `Advisor request failed with HTTP ${res.status}`);
      err.status = res.status;
      err.code = body.code || 'ADVISOR_REQUEST_FAILED';
      throw err;
    }

    return body;
  }
}

export const syncClient = new SyncClient();
