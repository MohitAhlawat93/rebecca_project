import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SEARCH_MEASUREMENT } from '../seo/search-measurement.config.mjs';
import {
  buildSearchIntelligence,
  normalizeBingAiPerformance,
  normalizeGoogleRows
} from '../lib/search-measurement-engine.mjs';
import {
  resolveMeasurementWindows,
  searchProviderStatus
} from '../lib/search-measurement-service.mjs';
import { buildGoogleWindowRequests } from '../lib/search-provider-google.mjs';

const windows = resolveMeasurementWindows(
  SEARCH_MEASUREMENT,
  new Date('2026-10-07T10:00:00Z')
);
assert.deepEqual(windows.current, { startDate: '2026-09-07', endDate: '2026-10-04' });
assert.deepEqual(windows.previous, { startDate: '2026-08-10', endDate: '2026-09-06' });

const googleRows = normalizeGoogleRows(
  [
    {
      keys: ['2026-10-01', 'rebecca singapore', 'https://www.risquerebecca.com/about', 'sgp', 'MOBILE'],
      clicks: 3,
      impressions: 180,
      ctr: 3 / 180,
      position: 6.4
    },
    {
      keys: ['2026-10-01', 'risque rebecca', 'https://www.risquerebecca.com/', 'sgp', 'DESKTOP'],
      clicks: 40,
      impressions: 90,
      ctr: 40 / 90,
      position: 1.4
    }
  ],
  { surface: 'web', dimensions: ['date', 'query', 'page', 'country', 'device'] }
);
assert.equal(googleRows[0].source, 'google');
assert.equal(googleRows[0].query, 'rebecca singapore');
assert.equal(googleRows[0].page, 'https://www.risquerebecca.com/about');

const previous = normalizeGoogleRows(
  [
    {
      keys: ['2026-09-01', 'rebecca singapore', 'https://www.risquerebecca.com/about', 'sgp', 'MOBILE'],
      clicks: 8,
      impressions: 260,
      ctr: 8 / 260,
      position: 5.8
    }
  ],
  { surface: 'web', dimensions: ['date', 'query', 'page', 'country', 'device'] }
);

const bingAi = normalizeBingAiPerformance([
  {
    Date: '2026-10-01',
    Page: 'https://www.risquerebecca.com/travel/london',
    GroundingQuery: 'rebecca london travel',
    Citations: 7,
    Topic: 'London travel',
    Intent: 'planning'
  }
]);
assert.equal(bingAi[0].surface, 'ai-citation');
assert.equal(bingAi[0].citations, 7);

const report = buildSearchIntelligence({
  current: [...googleRows, ...bingAi],
  previous,
  config: SEARCH_MEASUREMENT,
  providerStatus: {}
});
assert.ok(report.opportunities.some((item) => item.type === 'striking-distance-query'));
assert.ok(report.opportunities.some((item) => item.type === 'declining-page'));
assert.ok(report.opportunities.some((item) => item.type === 'ai-citation-strength'));
assert.equal(report.guardrails.autoPublish, false);
assert.equal(report.guardrails.humanApprovalRequired, true);

const requests = buildGoogleWindowRequests(
  SEARCH_MEASUREMENT,
  '2026-09-07',
  '2026-10-04'
);
assert.ok(requests.some((item) => item.type === 'web'));
assert.ok(requests.some((item) => item.type === 'image'));
assert.equal(requests[0].body.rowLimit, 25000);
assert.equal(requests[0].body.dataState, 'final');

const disconnected = searchProviderStatus(SEARCH_MEASUREMENT, {});
assert.equal(disconnected.googleStandard.state, 'needs-connection');
assert.equal(disconnected.bingStandard.state, 'needs-connection');
assert.equal(disconnected.googleGenerativeAi.state, 'export-required');
assert.equal(disconnected.googleMultimodal.state, 'export-required');
assert.equal(disconnected.bingAiPerformance.state, 'portal-export-required');

assert.equal(SEARCH_MEASUREMENT.intelligence.allowAutoPublish, false);
assert.ok(SEARCH_MEASUREMENT.intelligence.prohibitedRecommendations.includes('mass-generate-location-pages'));
assert.ok(SEARCH_MEASUREMENT.intelligence.prohibitedRecommendations.includes('safe-search-evasion'));

const api = fs.readFileSync(new URL('../api/admin/search-intelligence.js', import.meta.url), 'utf8');
assert.match(api, /Owner session required/);
assert.match(api, /Cache-Control/);
assert.match(api, /X-Robots-Tag/);

console.log('SEARCH-07 Search Measurement & Intelligence validation passed.');
