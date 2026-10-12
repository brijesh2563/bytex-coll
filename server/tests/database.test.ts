import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { initializeSchema } from '../src/db/schema.js';

describe('SQLite Foundation & Schema', () => {
  let db: DatabaseSync;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    initializeSchema(db);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  it('should initialize all required tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('operations');
    expect(tableNames).toContain('document_snapshots');
    expect(tableNames).toContain('conflicts');
    expect(tableNames).toContain('resolution_memory');
  });

  it('should enforce unique op_id constraint in operations table', () => {
    const insertStmt = db.prepare(`
      INSERT INTO operations (
        op_id, project_id, entity_id, type, payload,
        replica_id, client_seq, server_seq, lamport_time,
        version_vector, timestamp
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `);

    // First insert succeeds
    insertStmt.run(
      'op-101', 'proj-1', 'task-1', 'TASK_CREATE', '{}',
      'client-A', 1, 1, 1,
      '{}', 1700000000
    );

    // Duplicate insert with same op_id must fail
    expect(() => {
      insertStmt.run(
        'op-101', 'proj-1', 'task-1', 'TASK_CREATE', '{}',
        'client-A', 1, 1, 1,
        '{}', 1700000000
      );
    }).toThrow();
  });

  it('should enforce unique pattern_hash in resolution_memory', () => {
    const insertStmt = db.prepare(`
      INSERT INTO resolution_memory (
        id, pattern_hash, conflict_type, field, chosen_pattern, resolution_data
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run('mem-1', 'hash-abc', 'CONCURRENT_FIELD_COLLISION', 'status', 'PREFER_A', '{}');

    expect(() => {
      insertStmt.run('mem-2', 'hash-abc', 'CONCURRENT_FIELD_COLLISION', 'status', 'PREFER_B', '{}');
    }).toThrow();
  });
});
