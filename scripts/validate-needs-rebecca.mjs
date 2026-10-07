import assert from 'node:assert/strict';
import fs from 'node:fs';
import { REBECCA_DATA } from '../data/rebecca-data.js';
import {
  shouldCaptureNeedsRebeccaQuestion
} from '../lib/needs-rebecca-store.js';
import {
  buildDefaultConciergeControl
} from '../lib/concierge-control-store.js';
import { generateConciergeAnswer } from '../api/concierge.js';

assert.equal(shouldCaptureNeedsRebeccaQuestion('Does Rebecca enjoy astronomy?'), true);
assert.equal(shouldCaptureNeedsRebeccaQuestion('Email me at someone@example.com about this'), false);
assert.equal(shouldCaptureNeedsRebeccaQuestion('My number is +91 98765 43210'), false);
assert.equal(shouldCaptureNeedsRebeccaQuestion('Here is https://example.com/private'), false);
assert.equal(shouldCaptureNeedsRebeccaQuestion('What is her current hotel address?'), false);
assert.equal(shouldCaptureNeedsRebeccaQuestion('Can I send my passport document?'), false);
assert.equal(shouldCaptureNeedsRebeccaQuestion('My bank account details are ready'), false);

const originalGroqKey = process.env.GROQ_API_KEY;
delete process.env.GROQ_API_KEY;

const unknown = await generateConciergeAnswer({
  message: 'Does Rebecca have a public opinion about astronomy clubs?',
  history: [],
  page: '/',
  language: 'en',
  currentData: REBECCA_DATA,
  control: buildDefaultConciergeControl()
});
assert.equal(unknown.needsRebecca, true);

const known = await generateConciergeAnswer({
  message: 'What are Rebecca Singapore rates?',
  history: [],
  page: '/rates',
  language: 'en',
  currentData: REBECCA_DATA,
  control: buildDefaultConciergeControl()
});
assert.equal(known.needsRebecca, false);
if (typeof originalGroqKey === 'undefined') delete process.env.GROQ_API_KEY;
else process.env.GROQ_API_KEY = originalGroqKey;

const api = fs.readFileSync(new URL('../api/concierge.js', import.meta.url), 'utf8');
const admin = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const adminJs = fs.readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
const store = fs.readFileSync(new URL('../lib/needs-rebecca-store.js', import.meta.url), 'utf8');
const schema = fs.readFileSync(new URL('../supabase/rc-07-needs-rebecca.sql', import.meta.url), 'utf8');

assert.match(api, /recordNeedsRebeccaQuestion/);
assert.match(api, /const \{needsRebecca,\.\.\.publicResult\}=result/);
assert.match(api, /json\(publicResult\)/);
assert.match(admin, /data-tab="needs-rebecca"/);
assert.match(admin, /Privacy by design/);
assert.match(adminJs, /data-needs-draft-answer/);
assert.match(adminJs, /resolveNeedsFromPublishedAnswers/);
assert.match(adminJs, /\/api\/admin\/needs-rebecca/);
assert.match(store, /questionFingerprint/);
assert.match(store, /hasSensitiveContent/);
assert.match(store, /status: items\[index\]\.status === 'ignored' \|\| items\[index\]\.status === 'resolved'/);
assert.match(schema, /security_invoker = true/);
assert.match(schema, /enable row level security/);
assert.match(schema, /grant update/);

console.log('RC-07 Needs Rebecca validation passed.');
