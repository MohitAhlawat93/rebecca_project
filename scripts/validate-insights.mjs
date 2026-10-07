import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildOwnerInsights } from '../lib/owner-insights.js';

const admin=fs.readFileSync(new URL('../admin.html',import.meta.url),'utf8');
const adminJs=fs.readFileSync(new URL('../admin.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../server/admin/insights.js',import.meta.url),'utf8');
const engine=fs.readFileSync(new URL('../lib/owner-insights.js',import.meta.url),'utf8');

assert.match(admin,/data-tab="insights"/);
assert.match(admin,/Recommended next actions/);
assert.match(admin,/Recurring questions/);
assert.match(adminJs,/\/api\/admin\/insights/);
assert.match(adminJs,/data-insights-tab/);
assert.match(api,/Owner session required/);
assert.match(engine,/No visitor identity, IP address, raw chat history or screening documents/);
assert.match(engine,/recurringQuestions/);
assert.match(engine,/upcomingAutomaticChanges/);
assert.match(engine,/mediaDraftAhead/);

const fallback=await buildOwnerInsights({now:new Date('2026-10-07T05:30:00.000Z')});
assert.ok(fallback.health);
assert.ok(Array.isArray(fallback.attention));
assert.ok(Array.isArray(fallback.recurringQuestions));
assert.ok(Array.isArray(fallback.upcoming));
assert.ok(Array.isArray(fallback.recentActivity));

console.log('RC-10 Owner Insights validation passed.');
