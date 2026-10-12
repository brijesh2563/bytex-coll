import { Router, type Request, type Response } from 'express';
import { checkDatabaseHealth, getDb } from '../db/database.js';
import { config } from '../config.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  const dbHealth = checkDatabaseHealth();
  let serverSeq = 0;

  if (dbHealth.connected) {
    try {
      const row = getDb()
        .prepare('SELECT COALESCE(MAX(server_seq), 0) as max_seq FROM operations')
        .get() as { max_seq: number } | undefined;
      if (row) {
        serverSeq = row.max_seq;
      }
    } catch {
      // Degraded if query fails
    }
  }

  const status = dbHealth.connected ? (dbHealth.walMode ? 'healthy' : 'degraded') : 'unhealthy';
  const httpStatus = status === 'unhealthy' ? 503 : 200;

  res.status(httpStatus).json({
    status,
    service: config.serviceName,
    version: config.version,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    db: dbHealth,
    serverSeq
  });
});
