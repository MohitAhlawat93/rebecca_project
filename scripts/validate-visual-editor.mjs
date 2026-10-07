import assert from 'node:assert/strict';
import fs from 'node:fs';

const content = fs.readFileSync(new URL('../content.js', import.meta.url), 'utf8');
const editor = fs.readFileSync(new URL('../visual-editor.js', import.meta.url), 'utf8');
const admin = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const store = fs.readFileSync(new URL('../lib/admin-store.js', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../api/admin/visual-editor.js', import.meta.url), 'utf8');

assert.match(content, /rcEdit=['\"]availability['\"]/);
assert.match(content, /data-rc-edit="rate:/);
assert.match(content, /data-rc-edit="travel:/);
assert.match(content, /rcMediaPlacement=['"]hero['"]/);
assert.match(content, /window\.__RC_RENDER_STRUCTURED__/);
assert.match(content, /import\('\/visual-editor\.js'\)/);

assert.match(editor, /\/api\/admin\/visual-editor/);
assert.match(editor, /Save to Draft/);
assert.match(editor, /Publish/);
assert.match(editor, /Discard/);
assert.match(editor, /rc_edit/);
assert.match(editor, /adminMediaUrl/);
assert.match(editor, /data-rc-media-placement/);

assert.match(admin, /Rebecca Control · RC-(?:0[5-9]|[1-9][0-9]+)/);
assert.match(admin, /Edit Website ↗/);
assert.match(admin, /\?rc_edit=1/);

assert.match(store, /visual_draft: \{\}/);
assert.match(store, /readVisualEditorState/);
assert.match(store, /saveVisualEditorDraft/);
assert.match(store, /publishVisualEditorDraft/);
assert.match(store, /discardVisualEditorDraft/);

assert.match(api, /Owner session required/);
assert.match(api, /applyQuickControlState/);
assert.match(api, /action === 'publish'/);
assert.match(api, /action === 'discard'/);

console.log('RC-05 visual editor validation passed.');
