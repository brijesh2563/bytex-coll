import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  dbPath: string;
  corsOrigin: string | string[];
  serviceName: string;
  version: string;
  ollamaBaseUrl: string;
  ollamaApiKey: string;
  ollamaModel: string;
  ollamaTimeoutMs: number;
}

const defaultDbPath = path.resolve(__dirname, '../../data/nexussync.db');

export const config: ServerConfig = {
  port: Number.parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || defaultDbPath,
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : '*',
  serviceName: 'NexusSync Sync Coordinator',
  version: '0.1.0',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.com',
  ollamaApiKey: process.env.OLLAMA_API_KEY || '',
  ollamaModel: process.env.OLLAMA_MODEL || 'gemma4:cloud',
  ollamaTimeoutMs: Number.parseInt(process.env.OLLAMA_TIMEOUT_MS || '15000', 10)
};
