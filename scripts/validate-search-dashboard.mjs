import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeSystemSettings } from '../lib/system-store.js';
import { normalizeBingAiPerformance, normalizeBingRows, normalizeGoogleGenerativeAiExport, summarizeSearchData } from '../lib/search-measurement-engine.mjs';

const admin = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const searchJs = fs.readFileSync(new URL('../admin-search.js', import.meta.url), 'utf8');
const searchCss = fs.readFileSync(new URL('../admin-search.css', import.meta.url), 'utf8');
const intelligenceApi = fs.readFileSync(new URL('../server/admin/search-intelligence.js', import.meta.url), 'utf8');
const syncApi = fs.readFileSync(new URL('../server/admin/search-sync.js', import.meta.url), 'utf8');
const connectApi = fs.readFileSync(new URL('../server/admin/search-connect.js', import.meta.url), 'utf8');
const callbackApi = fs.readFileSync(new URL('../server/admin/search-oauth-callback.js', import.meta.url), 'utf8');
const importApi = fs.readFileSync(new URL('../server/admin/search-import.js', import.meta.url), 'utf8');
const bing = fs.readFileSync(new URL('../lib/search-provider-bing.mjs', import.meta.url), 'utf8');

assert.match(admin, /data-tab="search"/);
assert.match(admin, /data-panel="search"/);
assert.match(admin, /SEARCH-09 · Search Intelligence/);
assert.match(admin, /data-search-connect="google"/);
assert.match(admin, /data-search-connect="bing"/);
assert.match(admin, /data-search-opportunities/);
assert.match(admin, /data-search-pages/);
assert.match(admin, /data-search-queries/);
assert.match(admin, /data-search-surfaces/);
assert.match(admin, /data-search-import-kind/);
assert.match(admin, /admin-search\.js/);
assert.match(admin, /admin-search\.css/);
assert.match(admin, /option value="search">Search Intelligence/);

assert.equal(normalizeSystemSettings({ dashboardStartTab: 'search' }).dashboardStartTab, 'search');

assert.match(searchJs, /\/api\/admin\/search-intelligence\?mode=persisted/);
assert.match(searchJs, /\/api\/admin\/search-sync/);
assert.match(searchJs, /\/api\/admin\/search-connect\?provider=/);
assert.match(searchJs, /\/api\/admin\/search-import/);
assert.match(admin, /No visitor identity/);
assert.match(searchJs, /One-time technical setup/);
assert.match(searchJs, /MutationObserver/);
const adminController = fs.readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
assert.doesNotMatch(adminController, /\bsearchLoaded\b|\bloadSearchIntelligence\s*\(/, 'Search loading belongs to admin-search.js, not admin.js');
assert.doesNotMatch(searchJs, /SEARCH_TOKEN_ENCRYPTION_KEY/);
assert.doesNotMatch(searchJs, /SEARCH_STORE_SECRET/);
assert.doesNotMatch(searchJs, /CRON_SECRET/);
assert.doesNotMatch(searchJs, /GOOGLE_SEARCH_CLIENT_SECRET/);
assert.doesNotMatch(searchJs, /BING_WEBMASTER_CLIENT_SECRET/);

assert.match(searchCss, /@media\(max-width:760px\)/);
assert.match(searchCss, /@media\(max-width:560px\)/);
assert.match(searchCss, /rc-search-score-grid/);
assert.match(searchCss, /rc-search-connections/);

for (const source of [intelligenceApi, syncApi, connectApi, importApi]) {
  assert.match(source, /getAdminSession/);
  assert.match(source, /Owner session required/);
}
assert.match(callbackApi, /verifySearchOAuthState/);
assert.match(callbackApi, /tab=search/);
assert.match(connectApi, /returnPath: '\/admin\.html\?tab=search'/);

assert.match(bing, /surface: 'web-query'/);
assert.match(bing, /surface: 'web'/);
assert.doesNotMatch(bing, /page: row\.query/);

const queryRollup = normalizeBingRows(
  [{ Query: 'rebecca singapore', Clicks: 8, Impressions: 100 }],
  { surface: 'web-query' }
);
const pageRollup = normalizeBingRows(
  [{ Url: 'https://www.risquerebecca.com/about', Clicks: 8, Impressions: 100 }],
  { surface: 'web' }
);
const totals = summarizeSearchData([...queryRollup, ...pageRollup]);
assert.equal(totals.clicks, 8);
assert.equal(totals.impressions, 100);

const bingAi = normalizeBingAiPerformance([{
  'Date': '2026-10-01',
  'Cited page': 'https://www.risquerebecca.com/travel/london',
  'Grounding query': 'rebecca london travel',
  'Citation count': '5',
  'Cited pages': '1',
  'Topic': 'London travel',
  'Intent': 'planning'
}]);
assert.equal(bingAi[0].query, 'rebecca london travel');
assert.equal(bingAi[0].citations, 5);
assert.equal(bingAi[0].page, 'https://www.risquerebecca.com/travel/london');

const googleAi = normalizeGoogleGenerativeAiExport([{
  'Date': '2026-10-01',
  'Landing page': 'https://www.risquerebecca.com/about',
  'Impressions': '42',
  'Clicks': '3'
}]);
assert.equal(googleAi[0].page, 'https://www.risquerebecca.com/about');
assert.equal(googleAi[0].impressions, 42);

console.log('SEARCH-09 Search Intelligence dashboard validation passed.');
