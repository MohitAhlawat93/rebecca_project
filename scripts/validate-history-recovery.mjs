import assert from 'node:assert/strict';
import fs from 'node:fs';

const admin = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const adminJs = fs.readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../api/admin/system.js', import.meta.url), 'utf8');
const store = fs.readFileSync(new URL('../lib/system-store.js', import.meta.url), 'utf8');
const schema = fs.readFileSync(new URL('../supabase/rc-09-history-export-recovery.sql', import.meta.url), 'utf8');

assert.match(admin, /data-tab="history"/);
assert.match(admin, /data-tab="export"/);
assert.match(admin, /Restore to Draft/);
assert.match(admin, /Download backup/);
assert.match(adminJs, /\/api\/admin\/system/);
assert.match(adminJs, /restoreSystemSnapshot/);
assert.match(adminJs, /restoreImportedBackup/);
assert.match(api, /Owner session required/);
assert.match(api, /restoreSnapshotToDraft/);
assert.match(api, /restoreBundleToDraft/);
assert.match(store, /MAX_SNAPSHOTS=10/);
assert.match(store, /saveVisualEditorDraft/);
assert.match(store, /saveConciergeDraft/);
assert.match(store, /saveMediaDraft/);
assert.match(store, /Needs Rebecca inbox is intentionally excluded/);
assert.match(schema, /security_invoker = true/);
assert.match(schema, /enable row level security/);

for (const path of [
  '../api/admin/quick-control.js',
  '../api/admin/visual-editor.js',
  '../api/admin/concierge-control.js',
  '../api/admin/media.js'
]) {
  const text = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.match(text, /safeCaptureRecoverySnapshot|recordSystemEvent/);
}

console.log('RC-09 History, Export & Recovery validation passed.');
