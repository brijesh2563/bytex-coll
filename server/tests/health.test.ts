import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server.js';
import { initDatabase, closeDatabase } from '../src/db/database.js';

describe('Health & Error Endpoints', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    // Initialize with in-memory DB for test isolation
    initDatabase(':memory:');
    app = createApp();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('GET /api/v1/health should return truthful 200 OK metadata', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body.service).toBe('NexusSync Sync Coordinator');
    expect(res.body.version).toBe('0.1.0');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.db).toHaveProperty('connected', true);
    expect(typeof res.body.serverSeq).toBe('number');
  });

  it('GET /api/v1/unknown-endpoint should return structured 404 JSON', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('timestamp');
  });
});
