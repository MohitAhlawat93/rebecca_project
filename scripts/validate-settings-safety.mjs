import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DEFAULT_SYSTEM_SETTINGS,
  normalizeSystemSettings
} from '../lib/system-store.js';

const admin=fs.readFileSync(new URL('../admin.html',import.meta.url),'utf8');
const adminJs=fs.readFileSync(new URL('../admin.js',import.meta.url),'utf8');
const systemApi=fs.readFileSync(new URL('../api/admin/system.js',import.meta.url),'utf8');
const propose=fs.readFileSync(new URL('../api/admin/assistant-propose.js',import.meta.url),'utf8');
const apply=fs.readFileSync(new URL('../api/admin/assistant-apply.js',import.meta.url),'utf8');
const needs=fs.readFileSync(new URL('../lib/needs-rebecca-store.js',import.meta.url),'utf8');
const system=fs.readFileSync(new URL('../lib/system-store.js',import.meta.url),'utf8');
const schema=fs.readFileSync(new URL('../supabase/rc-11-settings-safety.sql',import.meta.url),'utf8');

assert.equal(DEFAULT_SYSTEM_SETTINGS.dashboardStartTab,'insights');
assert.equal(DEFAULT_SYSTEM_SETTINGS.aiAssistantEnabled,true);
assert.deepEqual(
  normalizeSystemSettings({
    dashboardStartTab:'media',
    aiAssistantEnabled:false,
    needsRebeccaCaptureEnabled:false,
    automaticRecoveryEnabled:false
  }),
  {
    dashboardStartTab:'media',
    aiAssistantEnabled:false,
    needsRebeccaCaptureEnabled:false,
    automaticRecoveryEnabled:false
  }
);
assert.equal(normalizeSystemSettings({dashboardStartTab:'not-real'}).dashboardStartTab,'insights');

assert.match(admin,/data-tab="settings"/);
assert.match(admin,/AI Admin Assistant/);
assert.match(admin,/Needs Rebecca capture/);
assert.match(admin,/Automatic recovery points/);
assert.match(adminJs,/saveSettings/);
assert.match(adminJs,/dashboardStartTab/);
assert.match(systemApi,/action==='saveSettings'/);
assert.match(propose,/aiAssistantEnabled\s*===\s*false/);
assert.match(apply,/aiAssistantEnabled\s*===\s*false/);
assert.match(needs,/needsRebeccaCaptureEnabled === false/);
assert.match(system,/automaticRecoveryEnabled\s*===\s*false/);
assert.match(schema,/settings jsonb/);
assert.match(schema,/security_invoker = true/);

console.log('RC-11 Settings & Safety Controls validation passed.');
