import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildDefaultQuickControlState,
  writeQuickControlState
} from '../lib/admin-store.js';

const js = fs.readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../server/admin/quick-control.js', import.meta.url), 'utf8');

assert.doesNotMatch(js, /\bsearchLoaded\b|\bloadSearchIntelligence\s*\(/);
assert.match(js, /expectedVersion: quickVersion/);
assert.match(js, /data-visual-draft-banner/);
assert.match(html, /Unpublished Website Draft exists/);
assert.match(html, /Review Website Draft/);
assert.match(api, /body\.expectedVersion/);
assert.match(api, /VISUAL_DRAFT_CONFLICT/);

const previous = {
  RC_SUPABASE_URL: process.env.RC_SUPABASE_URL,
  RC_SUPABASE_PUBLISHABLE_KEY: process.env.RC_SUPABASE_PUBLISHABLE_KEY,
  RC_STORE_SECRET: process.env.RC_STORE_SECRET
};
const originalFetch = globalThis.fetch;
process.env.RC_SUPABASE_URL = 'https://mock.invalid';
process.env.RC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mock';
process.env.RC_STORE_SECRET = 'test-only-rebecca-control-secret';

const published = buildDefaultQuickControlState();
const working = structuredClone(published);
working.availability = { ...working.availability, status: 'limited', message: 'Test message' };

let row = { id: 'current', version: 3, payload: structuredClone(published), visual_draft: {}, updated_at: '2026-10-08T00:00:00Z' };
let patches = 0;
let simulateConcurrentEdit = false;
let simulateStoreFailure = false;
const response = (data, status = 200) => ({
  status,
  ok: status >= 200 && status < 300,
  text: async () => JSON.stringify(data)
});

globalThis.fetch = async (url, options = {}) => {
  if (simulateStoreFailure) throw new Error('Storage unavailable');
  if (options.method === 'GET' && String(url).includes('/rebecca_control_api')) {
    return response([structuredClone(row)]);
  }
  if (options.method === 'PATCH' && String(url).includes('/rebecca_control_api')) {
    patches += 1;
    const requestedVersion = Number(new URL(url).searchParams.get('version')?.replace('eq.', ''));
    if (simulateConcurrentEdit) {
      row.version += 1; // Simulate another tab saving between read and conditional PATCH.
      simulateConcurrentEdit = false;
    }
    if (requestedVersion !== row.version) return response([]);
    row = { ...row, ...JSON.parse(options.body) };
    return response([structuredClone(row)]);
  }
  throw new Error('Unexpected mocked request ' + options.method + ' ' + url);
};

try {
  // A saved Visual Editor Draft is never erased by Quick Control.
  row.visual_draft = structuredClone(working);
  await assert.rejects(
    writeQuickControlState(working, 'Test Owner', 3),
    (error) => error?.code === 'VISUAL_DRAFT_CONFLICT'
  );
  assert.equal(patches, 0);
  assert.deepEqual(row.visual_draft, working);
  assert.equal(row.version, 3);

  // A stale Quick Control tab is rejected even if the draft is empty.
  row.visual_draft = {};
  await assert.rejects(
    writeQuickControlState(working, 'Test Owner', 2),
    (error) => error?.code === 'STORE_CONFLICT'
  );
  assert.equal(patches, 0);

  // A concurrent update also fails the PATCH version predicate.
  simulateConcurrentEdit = true;
  await assert.rejects(
    writeQuickControlState(working, 'Test Owner', 3),
    (error) => error?.code === 'STORE_CONFLICT'
  );
  assert.equal(patches, 1);
  assert.equal(row.version, 4);
  assert.equal(row.payload.availability.status, published.availability.status);

  // Fresh matching version can publish and increments the version.
  const result = await writeQuickControlState(working, 'Test Owner', 4);
  assert.equal(result.version, 5);
  assert.equal(result.state.availability.status, 'limited');
  assert.deepEqual(row.visual_draft, {});
  assert.equal(row.payload.availability.status, 'limited');

  // Storage failure must not produce a "saved" response.
  simulateStoreFailure = true;
  await assert.rejects(
    writeQuickControlState(working, 'Test Owner', 5),
    (error) => error?.code === 'STORE_UNAVAILABLE'
  );
  assert.equal(row.version, 5);
} finally {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

console.log('RC-QA-01 draft, stale-version, concurrent-write and storage-failure checks passed.');
