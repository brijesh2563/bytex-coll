import { Router, type Request, type Response } from 'express';
import type { ConflictAdvisorResponse } from '@nexussync/shared';
import { OperationsRepository } from '../db/operations-repository.js';
import {
  ConflictAdvisorService,
  AdvisorUnconfiguredError,
  AdvisorTimeoutError,
  AdvisorProviderError,
  AdvisorInvalidResponseError
} from '../services/conflict-advisor-service.js';

export function createConflictAdvisorRouter(
  customRepo?: OperationsRepository,
  customAdvisorService?: ConflictAdvisorService
): Router {
  const router = Router();

  const handleAdviseRequest = async (req: Request, res: Response): Promise<void> => {
    const repo = customRepo || new OperationsRepository();
    const advisorService = customAdvisorService || new ConflictAdvisorService();
    const rawProjectId = req.params.projectId;
    const rawConflictId = req.params.conflictId;

    const projectId = typeof rawProjectId === 'string' ? rawProjectId.trim() : '';
    const conflictId = typeof rawConflictId === 'string' ? rawConflictId.trim() : '';

    if (!projectId || projectId.length > 128) {
      const errorResponse: ConflictAdvisorResponse = {
        success: false,
        error: 'Invalid or missing projectId parameter',
        code: 'INVALID_PROJECT_ID'
      };
      res.status(400).json(errorResponse);
      return;
    }

    if (!conflictId || conflictId.length > 128) {
      const errorResponse: ConflictAdvisorResponse = {
        success: false,
        error: 'Invalid or missing conflictId parameter',
        code: 'INVALID_CONFLICT_ID'
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 1. Look up conflict in repository (read-only)
    const conflict = repo.getConflictById(conflictId);
    if (!conflict || conflict.projectId !== projectId) {
      const errorResponse: ConflictAdvisorResponse = {
        success: false,
        error: `Conflict '${conflictId}' not found for project '${projectId}'`,
        code: 'CONFLICT_NOT_FOUND'
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 2. Conflict must be currently active (UNRESOLVED)
    if (conflict.status !== 'UNRESOLVED') {
      const errorResponse: ConflictAdvisorResponse = {
        success: false,
        error: `Conflict '${conflictId}' is already resolved with strategy '${conflict.status}'`,
        code: 'CONFLICT_ALREADY_RESOLVED'
      };
      res.status(409).json(errorResponse);
      return;
    }

    // 3. Optional task context from snapshot for domain constraints
    let taskContext;
    try {
      const snapshot = repo.getWorkspaceSnapshot(projectId);
      taskContext = snapshot.tasks.find((t) => t.id === conflict.entityId);
    } catch {
      // Continue even if snapshot lookup fails
    }

    // 4. Request non-mutating AI analysis
    try {
      const analysis = await advisorService.analyzeConflict(conflict, taskContext);
      const response: ConflictAdvisorResponse = {
        success: true,
        data: analysis
      };
      res.status(200).json(response);
    } catch (err) {
      if (err instanceof AdvisorUnconfiguredError) {
        const errorResponse: ConflictAdvisorResponse = {
          success: false,
          error: err.message,
          code: 'ADVISOR_UNCONFIGURED'
        };
        res.status(503).json(errorResponse);
        return;
      }

      if (err instanceof AdvisorTimeoutError) {
        const errorResponse: ConflictAdvisorResponse = {
          success: false,
          error: err.message,
          code: 'ADVISOR_TIMEOUT'
        };
        res.status(504).json(errorResponse);
        return;
      }

      if (err instanceof AdvisorProviderError) {
        const errorResponse: ConflictAdvisorResponse = {
          success: false,
          error: err.message,
          code: 'ADVISOR_PROVIDER_ERROR'
        };
        res.status(502).json(errorResponse);
        return;
      }

      if (err instanceof AdvisorInvalidResponseError) {
        const errorResponse: ConflictAdvisorResponse = {
          success: false,
          error: err.message,
          code: 'ADVISOR_INVALID_RESPONSE'
        };
        res.status(502).json(errorResponse);
        return;
      }

      const errorResponse: ConflictAdvisorResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'Internal advisory error occurred',
        code: 'ADVISOR_INTERNAL_ERROR'
      };
      res.status(500).json(errorResponse);
    }
  };

  // Support both POST (action/analysis request) and GET (retrieval)
  router.post('/workspaces/:projectId/conflicts/:conflictId/advise', handleAdviseRequest);
  router.get('/workspaces/:projectId/conflicts/:conflictId/advise', handleAdviseRequest);

  return router;
}

export const conflictAdvisorRouter = createConflictAdvisorRouter();
