import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  decryptSearchToken,
  encryptSearchToken,
  searchStoreConfigured
} from '../lib/search-persistence-store.mjs';
import {
  buildSearchAuthorizationUrl,
  refreshSearchAccessToken,
  verifySearchOAuthState
} from '../lib/search-oauth.mjs';
import { resolveSyncWindow } from '../lib/search-sync-service.mjs';
import { SEARCH_MEASUREMENT } from '../seo/search-measurement.config.mjs';

const fakeEnv = {
  RC_SUPABASE_URL: 'https://example.supabase.co',
  RC_SUPABASE_PUBLISHABLE_KEY: 'publishable-test',
  SEARCH_STORE_SECRET: 's'.repeat(48),
  SEARCH_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64url'),
  SEARCH_OAUTH_STATE_SECRET: 'o'.repeat(48),
  SEARCH_OAUTH_REDIRECT_ORIGIN: 'https://example.com',
  GOOGLE_SEARCH_CLIENT_ID: 'google-client',
  GOOGLE_SEARCH_CLIENT_SECRET: 'google-secret',
  BING_WEBMASTER_CLIENT_ID: 'bing-client',
  BING_WEBMASTER_CLIENT_SECRET: 'bing-secret'
};

assert.equal(searchStoreConfigured(fakeEnv), true);

const encrypted = encryptSearchToken('refresh-token-secret', fakeEnv);
assert.notEqual(encrypted, 'refresh-token-secret');
assert.match(encrypted, /^v1\./);
assert.equal(decryptSearchToken(encrypted, fakeEnv), 'refresh-token-secret');

const googleUrl = new URL(
  buildSearchAuthorizationUrl('google', {
    clientId: 'client-test',
    env: fakeEnv,
    now: Date.parse('2026-10-07T10:00:00Z')
  })
);
assert.equal(googleUrl.origin, 'https://accounts.google.com');
assert.equal(googleUrl.searchParams.get('access_type'), 'offline');
assert.equal(
  googleUrl.searchParams.get('scope'),
  'https://www.googleapis.com/auth/webmasters.readonly'
);
const googleState = verifySearchOAuthState(
  googleUrl.searchParams.get('state'),
  fakeEnv,
  Date.parse('2026-10-07T10:05:00Z')
);
assert.equal(googleState.provider, 'google');
assert.equal(googleState.clientId, 'client-test');

const bingUrl = new URL(
  buildSearchAuthorizationUrl('bing', {
    clientId: 'client-test',
    env: fakeEnv,
    now: Date.parse('2026-10-07T10:00:00Z')
  })
);
assert.equal(bingUrl.hostname, 'www.bing.com');
assert.equal(bingUrl.searchParams.get('scope'), 'Webmaster.read');

let refreshBody = null;
const refreshed = await refreshSearchAccessToken(
  'google',
  'stored-refresh',
  {
    env: fakeEnv,
    fetchImpl: async (_url, options) => {
      refreshBody = options.body;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'new-access',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      };
    }
  }
);
assert.equal(refreshed.access_token, 'new-access');
assert.equal(refreshBody.get('grant_type'), 'refresh_token');
assert.equal(refreshBody.get('refresh_token'), 'stored-refresh');

const syncWindow = resolveSyncWindow(
  SEARCH_MEASUREMENT,
  new Date('2026-10-07T10:00:00Z')
);
assert.deepEqual(syncWindow, {
  startDate: '2026-08-31',
  endDate: '2026-10-04'
});

const vercel = JSON.parse(
  fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')
);
assert.ok(
  vercel.crons.some(
    (cron) =>
      cron.path === '/api/cron/search-sync' &&
      cron.schedule === SEARCH_MEASUREMENT.sync.schedule
  )
);

const cronApi = fs.readFileSync(
  new URL('../api/cron/search-sync.js', import.meta.url),
  'utf8'
);
assert.match(cronApi, /CRON_SECRET/);
assert.match(cronApi, /Bearer/);
assert.match(cronApi, /syncAllSearchProviders/);

const callback = fs.readFileSync(
  new URL('../server/admin/search-oauth-callback.js', import.meta.url),
  'utf8'
);
assert.match(callback, /verifySearchOAuthState/);
assert.match(callback, /saveProviderConnection/);
assert.match(callback, /refreshToken/);

const sql = fs.readFileSync(
  new URL('../supabase/search_08_measurement_persistence.sql', import.meta.url),
  'utf8'
);
for (const table of [
  'search_provider_connections',
  'search_metric_rows',
  'search_sync_runs',
  'search_sync_state'
]) {
  assert.match(sql, new RegExp('create table if not exists public\\.' + table));
}
assert.match(sql, /enable row level security/);
assert.match(sql, /x-search-store-secret/);
assert.match(sql, /grant select, insert, update/);

assert.equal(SEARCH_MEASUREMENT.sync.enabled, true);
assert.equal(SEARCH_MEASUREMENT.sync.lookbackDays, 35);
assert.deepEqual(SEARCH_MEASUREMENT.sync.providers, ['google', 'bing']);

console.log('SEARCH-08 Automated Search Data Sync & Persistence validation passed.');
