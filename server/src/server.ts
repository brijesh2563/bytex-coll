import http from 'node:http';
import { pathToFileURL } from 'node:url';
import express, { type Express } from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
} from '@nexussync/shared';
import { config } from './config.js';
import { initDatabase, closeDatabase } from './db/database.js';
import { healthRouter } from './routes/health.js';
import { workspaceRouter } from './routes/workspace.js';
import { conflictAdvisorRouter } from './routes/conflict-advisor.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { registerSyncHandlers } from './sockets/sync-handlers.js';
import { OperationsRepository } from './db/operations-repository.js';
import type { Router } from 'express';

export function createApp(customAdvisorRouter?: Router): Express {
  const app = express();

  // Basic middleware
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  // Mount API routes
  app.use('/api/v1', healthRouter);
  app.use('/api/v1', workspaceRouter);
  app.use('/api/v1', customAdvisorRouter || conflictAdvisorRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function createServer(customRepo?: OperationsRepository): {
  app: Express;
  httpServer: http.Server;
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  repo: OperationsRepository;
} {
  // Ensure DB initialized
  initDatabase();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST']
      }
    }
  );

  const repo = customRepo || new OperationsRepository();

  // Register real-time synchronization handlers
  registerSyncHandlers(io, repo);

  return { app, httpServer, io, repo };
}

export function startServer(): Promise<{
  httpServer: http.Server;
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  port: number;
}> {
  return new Promise((resolve, reject) => {
    try {
      const { httpServer, io } = createServer();
      const port = config.port;
      const host = config.host;

      httpServer.listen(port, host, () => {
        resolve({ httpServer, io, port });
      });

      httpServer.on('error', (err) => {
        reject(err);
      });

      // Graceful shutdown
      const shutdown = () => {
        io.close(() => {
          httpServer.close(() => {
            closeDatabase();
            process.exit(0);
          });
        });
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    } catch (error) {
      reject(error);
    }
  });
}

// Start if executed directly
if (
  process.env.NODE_ENV !== 'test' &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startServer()
    .then(({ port }) => {
      console.log(`[NexusSync] Sync Coordinator running on http://localhost:${port}`);
    })
    .catch((err) => {
      console.error('[NexusSync] Fatal startup error:', err);
      process.exit(1);
    });
}
