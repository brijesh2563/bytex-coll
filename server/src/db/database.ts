import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';
import { initializeSchema } from './schema.js';

let dbInstance: DatabaseSync | null = null;

export function initDatabase(dbFilePath = config.dbPath): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  // Ensure directory exists if not in-memory
  if (dbFilePath !== ':memory:') {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbFilePath);

  // WAL mode for high concurrency
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  initializeSchema(db);

  dbInstance = db;
  return dbInstance;
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
  }
  dbInstance = null;
}

export function checkDatabaseHealth(): { connected: boolean; walMode: boolean } {
  try {
    const db = getDb();
    const row = db.prepare('PRAGMA journal_mode;').get() as { journal_mode?: string } | undefined;
    const mode = row?.journal_mode || '';
    return {
      connected: true,
      walMode: mode.toLowerCase() === 'wal' || mode.toLowerCase() === 'memory'
    };
  } catch {
    return { connected: false, walMode: false };
  }
}
