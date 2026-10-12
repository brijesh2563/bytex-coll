import request from 'supertest';
import {
  type SyncOperation,
  validateConflictAdvisorOutput
} from '@nexussync/shared';
import { initDatabase, closeDatabase, getDb } from '../src/db/database.js';
import { OperationsRepository } from '../src/db/operations-repository.js';
import { ConflictAdvisorService } from '../src/services/conflict-advisor-service.js';
import { createConflictAdvisorRouter } from '../src/routes/conflict-advisor.js';
import { createApp } from '../src/server.js';
import { config } from '../src/config.js';

async function main() {
  console.log('===============================================================');
  console.log('NexusSync AI Conflict Advisor — Isolated Real Cloud Inference Test');
  console.log('===============================================================\n');

  // 1. Verify environment configuration without exposing secrets
  const apiKey = process.env.OLLAMA_API_KEY || config.ollamaApiKey;
  const model = process.env.OLLAMA_MODEL || config.ollamaModel || 'gemma4:cloud';
  const baseUrl = process.env.OLLAMA_BASE_URL || config.ollamaBaseUrl || 'https://ollama.com';

  const keyConfigured = Boolean(apiKey && apiKey.trim().length > 0);
  const keyLength = keyConfigured ? apiKey.trim().length : 0;

  console.log('1. Configuration Verification:');
  console.log(`   - OLLAMA_API_KEY Configured: ${keyConfigured} (Length: ${keyLength})`);
  console.log(`   - OLLAMA_MODEL: ${model}`);
  console.log(`   - OLLAMA_BASE_URL: ${baseUrl}`);

  if (!keyConfigured) {
    console.error('\n[BLOCKER] OLLAMA_API_KEY is not configured in process environment. Aborting test.');
    process.exit(1);
  }

  // 2. Initialize isolated in-memory SQLite database
  console.log('\n2. Initializing Isolated In-Memory SQLite Database (:memory:)...');
  initDatabase(':memory:');
  const db = getDb();
  const repo = new OperationsRepository(db);

  const PROJECT_ID = 'proj-synth-test';
  const ENTITY_ID = 'task-synth-1';

  // 3. Seed minimum valid synthetic conflict fixture using authoritative APIs
  console.log('3. Seeding Synthetic Conflict Fixture via Authoritative Repository APIs...');

  const baseOp: SyncOperation = {
    opId: 'op-synth-create',
    projectId: PROJECT_ID,
    entityId: ENTITY_ID,
    type: 'TASK_CREATE',
    payload: {
      entityId: ENTITY_ID,
      title: 'Prepare System Architecture Diagram',
      description: 'Document the distributed synchronization architecture',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
      dependencies: []
    },
    replicaId: 'client-alpha',
    clientSeq: 1,
    serverSeq: null,
    lamportTime: 1,
    versionVector: { 'client-alpha': 1 },
    timestamp: 1773000000000
  };
  repo.ingestBatch(PROJECT_ID, [baseOp]);

  // Concurrent edit A: client-alpha retains priority MEDIUM
  const opA: SyncOperation = {
    opId: 'op-synth-A',
    projectId: PROJECT_ID,
    entityId: ENTITY_ID,
    type: 'TASK_UPDATE_FIELD',
    payload: {
      entityId: ENTITY_ID,
      field: 'priority',
      oldValue: 'MEDIUM',
      newValue: 'LOW'
    },
    replicaId: 'client-alpha',
    clientSeq: 2,
    serverSeq: null,
    lamportTime: 2,
    versionVector: { 'client-alpha': 2, 'client-beta': 0 },
    timestamp: 1773000001000
  };

  // Concurrent edit B: client-beta escalates priority to HIGH
  const opB: SyncOperation = {
    opId: 'op-synth-B',
    projectId: PROJECT_ID,
    entityId: ENTITY_ID,
    type: 'TASK_UPDATE_FIELD',
    payload: {
      entityId: ENTITY_ID,
      field: 'priority',
      oldValue: 'MEDIUM',
      newValue: 'HIGH'
    },
    replicaId: 'client-beta',
    clientSeq: 1,
    serverSeq: null,
    lamportTime: 2,
    versionVector: { 'client-alpha': 1, 'client-beta': 1 },
    timestamp: 1773000002000
  };

  repo.ingestBatch(PROJECT_ID, [opA]);
  const ingestB = repo.ingestBatch(PROJECT_ID, [opB]);

  const conflicts = repo.getUnresolvedConflicts(PROJECT_ID);
  if (conflicts.length === 0) {
    console.error('\n[ERROR] Failed to generate unresolved conflict in fixture.');
    closeDatabase();
    process.exit(1);
  }

  const targetConflict = conflicts[0];
  console.log(`   - Generated Conflict ID: ${targetConflict.conflictId}`);
  console.log(`   - Entity ID: ${targetConflict.entityId}`);
  console.log(`   - Field: ${targetConflict.field}`);
  console.log(`   - Type: ${targetConflict.type}`);
  console.log(`   - Branch A Value: ${JSON.stringify(targetConflict.branchA.value)}`);
  console.log(`   - Branch B Value: ${JSON.stringify(targetConflict.branchB.value)}`);

  // 4. Record baseline database state before inference
  const opCountBefore = (db.prepare('SELECT COUNT(*) as cnt FROM operations').get() as any).cnt;
  const seqBefore = repo.getHighestServerSeq(PROJECT_ID);
  const conflictCountBefore = repo.getUnresolvedConflicts(PROJECT_ID).length;
  const snapshotBefore = JSON.stringify(repo.getWorkspaceSnapshot(PROJECT_ID));

  // 5. Construct real Advisor Service and isolated Express App
  console.log('\n4. Dispatching EXACTLY ONE Real Ollama Cloud Inference Request...');
  const advisorService = new ConflictAdvisorService({
    baseUrl,
    apiKey,
    model,
    timeoutMs: 30000 // 30s bounded timeout for real network inference
  });

  const customRouter = createConflictAdvisorRouter(repo, advisorService);
  const app = createApp(customRouter);

  const startTime = Date.now();
  const res = await request(app)
    .post(`/api/v1/workspaces/${PROJECT_ID}/conflicts/${targetConflict.conflictId}/advise`)
    .set('Accept', 'application/json');

  const durationMs = Date.now() - startTime;
  console.log(`   - Inference Round-Trip Duration: ${durationMs}ms`);
  console.log(`   - HTTP Response Status: ${res.status}`);

  if (res.status !== 200) {
    console.error('\n[FAILURE] Advisor endpoint returned non-200 status:');
    console.error(JSON.stringify(res.body, null, 2));
    closeDatabase();
    process.exit(1);
  }

  const analysis = res.body.data;

  // 6. Validate response against runtime schema validator
  console.log('\n5. Validating Response Against Shared Runtime Schema Validator...');
  const validation = validateConflictAdvisorOutput(analysis);
  console.log(`   - Schema Validation Result: ${validation.valid ? 'PASSED (100% Valid)' : 'FAILED'}`);
  if (!validation.valid) {
    console.error(`   - Validation Error: ${validation.error}`);
    closeDatabase();
    process.exit(1);
  }

  console.log(`   - Explanation: "${analysis.explanation}"`);
  console.log(`   - Suggestions Returned: ${analysis.suggestions.length}`);
  analysis.suggestions.forEach((s: any, idx: number) => {
    console.log(`     [Suggestion ${idx + 1}] Strategy: ${s.strategy} | Value: ${JSON.stringify(s.suggestedValue)} | Confidence: ${s.confidence}`);
    console.log(`       Rationale: "${s.rationale}"`);
  });
  console.log(`   - Risks Identified: ${analysis.risks.length}`);
  analysis.risks.forEach((r: string, idx: number) => {
    console.log(`     [Risk ${idx + 1}] "${r}"`);
  });
  console.log(`   - requiresHumanApproval: ${analysis.requiresHumanApproval}`);
  console.log(`   - modelUsed: ${analysis.modelUsed}`);

  // 7. Verify zero-mutation invariant
  console.log('\n6. Verifying Non-Mutating Authoritative State Invariant:');
  const opCountAfter = (db.prepare('SELECT COUNT(*) as cnt FROM operations').get() as any).cnt;
  const seqAfter = repo.getHighestServerSeq(PROJECT_ID);
  const conflictCountAfter = repo.getUnresolvedConflicts(PROJECT_ID).length;
  const snapshotAfter = JSON.stringify(repo.getWorkspaceSnapshot(PROJECT_ID));

  const opDiff = opCountAfter === opCountBefore;
  const seqDiff = seqAfter === seqBefore;
  const confDiff = conflictCountAfter === conflictCountBefore;
  const snapDiff = snapshotAfter === snapshotBefore;

  console.log(`   - Operations Count: ${opCountBefore} -> ${opCountAfter} (Unchanged: ${opDiff})`);
  console.log(`   - Highest Server Sequence: ${seqBefore} -> ${seqAfter} (Unchanged: ${seqDiff})`);
  console.log(`   - Unresolved Conflicts Count: ${conflictCountBefore} -> ${conflictCountAfter} (Unchanged: ${confDiff})`);
  console.log(`   - Workspace Snapshot: (Identical: ${snapDiff})`);

  if (!opDiff || !seqDiff || !confDiff || !snapDiff) {
    console.error('\n[INVARIANT VIOLATION] Authoritative state was mutated during advisory call!');
    closeDatabase();
    process.exit(1);
  }

  closeDatabase();

  console.log('\n===============================================================');
  console.log('SUCCESS: Real Ollama Cloud inference test passed all invariants!');
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('\n[UNHANDLED ERROR]', err);
  closeDatabase();
  process.exit(1);
});
