import type { DatabaseSync } from 'node:sqlite';

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  op_id TEXT NOT NULL UNIQUE,
  project_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  replica_id TEXT NOT NULL,
  client_seq INTEGER NOT NULL,
  server_seq INTEGER,
  lamport_time INTEGER NOT NULL,
  version_vector TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operations_project_server_seq 
  ON operations(project_id, server_seq);

CREATE UNIQUE INDEX IF NOT EXISTS idx_operations_project_server_seq_unique 
  ON operations(project_id, server_seq) 
  WHERE server_seq IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_operations_op_id 
  ON operations(op_id);

CREATE INDEX IF NOT EXISTS idx_operations_entity 
  ON operations(project_id, entity_id);

CREATE TABLE IF NOT EXISTS project_sequences (
  project_id TEXT PRIMARY KEY,
  last_server_seq INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_snapshots (
  project_id TEXT PRIMARY KEY,
  server_seq INTEGER NOT NULL DEFAULT 0,
  version_vector TEXT NOT NULL DEFAULT '{}',
  snapshot_data TEXT NOT NULL DEFAULT '{}',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conflicts (
  conflict_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNRESOLVED',
  branch_a TEXT NOT NULL,
  branch_b TEXT NOT NULL,
  suggested_resolution TEXT,
  winning_value TEXT,
  resolved_by TEXT,
  resolved_at TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conflicts_project_status 
  ON conflicts(project_id, status);

CREATE TABLE IF NOT EXISTS resolution_memory (
  id TEXT PRIMARY KEY,
  pattern_hash TEXT NOT NULL UNIQUE,
  conflict_type TEXT NOT NULL,
  field TEXT NOT NULL,
  chosen_pattern TEXT NOT NULL,
  resolution_data TEXT NOT NULL,
  times_applied INTEGER NOT NULL DEFAULT 1,
  last_used DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export function initializeSchema(db: DatabaseSync): void {
  db.exec(SCHEMA_SQL);
}
