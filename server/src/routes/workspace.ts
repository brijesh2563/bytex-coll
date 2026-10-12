import { Router, type Request, type Response } from 'express';
import { type WorkspaceSnapshotResponse } from '@nexussync/shared';
import { OperationsRepository } from '../db/operations-repository.js';

export const workspaceRouter = Router();

workspaceRouter.get('/workspaces/:projectId/snapshot', (req: Request, res: Response) => {
  const rawId = req.params.projectId;
  const projectId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

  if (!projectId || projectId.trim().length === 0 || projectId.length > 128) {
    const errorResponse: WorkspaceSnapshotResponse = {
      success: false,
      data: {
        projectId: projectId || 'unknown',
        serverSeq: 0,
        versionVector: {},
        tasks: [],
        unresolvedConflicts: []
      },
      error: 'Invalid projectId parameter'
    };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    const repo = new OperationsRepository();
    const snapshot = repo.getWorkspaceSnapshot(projectId);

    const response: WorkspaceSnapshotResponse = {
      success: true,
      data: snapshot
    };

    res.status(200).json(response);
  } catch (err) {
    const errorResponse: WorkspaceSnapshotResponse = {
      success: false,
      data: {
        projectId,
        serverSeq: 0,
        versionVector: {},
        tasks: [],
        unresolvedConflicts: []
      },
      error: err instanceof Error ? err.message : 'Failed to retrieve workspace snapshot'
    };
    res.status(500).json(errorResponse);
  }
});
