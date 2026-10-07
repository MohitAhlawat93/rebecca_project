import assert from 'node:assert/strict';
import fs from 'node:fs';
import { REBECCA_CONTROL_PHASES } from '../data/rebecca-control-phases.js';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const admin = read('../admin.html');
const readme = read('../README.md');
const pkg = JSON.parse(read('../package.json'));

for (const phase of REBECCA_CONTROL_PHASES) {
  assert.ok(readme.includes(phase.id), phase.id + ' is missing from README');
  assert.ok(readme.includes(phase.name), phase.name + ' is missing from README');
  assert.ok(admin.includes(phase.id), phase.id + ' is missing from Rebecca Control Settings registry');
  assert.ok(admin.includes(phase.name), phase.name + ' is missing from Rebecca Control Settings registry');
}

const requiredArtifacts = [
  '../lib/admin-auth.js',
  '../scripts/validate-admin-auth.mjs',
  '../lib/admin-store.js',
  '../scripts/validate-quick-control.mjs',
  '../supabase/rc-02-quick-control.sql',
  '../lib/media-store.js',
  '../scripts/validate-media.mjs',
  '../supabase/rc-03-media-publishing.sql',
  '../lib/schedule-engine.js',
  '../scripts/validate-scheduling.mjs',
  '../lib/media-schedule.js',
  '../scripts/validate-scheduled-publishing.mjs',
  '../supabase/rc-04b-scheduled-publishing.sql',
  '../visual-editor.js',
  '../scripts/validate-visual-editor.mjs',
  '../supabase/rc-05-visual-editor.sql',
  '../lib/concierge-control-store.js',
  '../server/admin/concierge-control.js',
  '../scripts/validate-concierge-control.mjs',
  '../supabase/rc-06-concierge-control.sql',
  '../lib/needs-rebecca-store.js',
  '../server/admin/needs-rebecca.js',
  '../scripts/validate-needs-rebecca.mjs',
  '../supabase/rc-07-needs-rebecca.sql',
  '../lib/admin-assistant.js',
  '../server/admin/assistant-propose.js',
  '../server/admin/assistant-apply.js',
  '../scripts/validate-admin-assistant.mjs',
  '../lib/system-store.js',
  '../server/admin/system.js',
  '../scripts/validate-history-recovery.mjs',
  '../supabase/rc-09-history-export-recovery.sql',
  '../lib/owner-insights.js',
  '../server/admin/insights.js',
  '../scripts/validate-insights.mjs',
  '../scripts/validate-settings-safety.mjs',
  '../supabase/rc-11-settings-safety.sql'
];

for (const path of requiredArtifacts) {
  assert.equal(fs.existsSync(new URL(path, import.meta.url)), true, 'Missing RC artifact: ' + path);
}

for (const script of [
  'validate:admin','validate:quick-control','validate:media','validate:schedule',
  'validate:scheduled-publishing','validate:visual-editor','validate:concierge-control',
  'validate:needs-rebecca','validate:admin-assistant','validate:history-recovery',
  'validate:insights','validate:settings-safety'
]) {
  assert.ok(pkg.scripts?.[script], 'Missing package validator: ' + script);
}

assert.ok(readme.includes('## Rebecca Control — RC-08 AI Admin Assistant'));
assert.ok(admin.includes('RC-06 · Concierge Control'));
assert.ok(admin.includes('RC-07 · Needs Rebecca'));
assert.ok(admin.includes('RC-08 · AI Admin Assistant'));
assert.ok(admin.includes('RC-10 · Owner Insights'));
assert.ok(admin.includes('RC-11 · Settings & Safety Controls'));

console.log('Canonical Rebecca Control roadmap validation passed.');
