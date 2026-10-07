import assert from 'node:assert/strict';
import fs from 'node:fs';
import { REBECCA_DATA } from '../data/rebecca-data.js';
import {
  buildDefaultConciergeControl,
  normalizeConciergeControl,
  publicConciergeUiConfig
} from '../lib/concierge-control-store.js';
import { generateConciergeAnswer } from '../api/concierge.js';

const admin = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const adminJs = fs.readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
const publicJs = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const schema = fs.readFileSync(new URL('../supabase/rc-06-concierge-control.sql', import.meta.url), 'utf8');

const defaults = buildDefaultConciergeControl();
assert.equal(defaults.enabled, true);
assert.equal(defaults.trustedAnswers.length, 0);

const normalized = normalizeConciergeControl({
  ...defaults,
  trustedAnswers: [{
    id: 'reply-time',
    question: 'What is the moonlight salon reply rule?',
    answer: 'Moonlight Salon answers are handled directly by Rebecca.',
    keywords: ['moonlight salon'],
    linkPath: '/contact',
    linkLabel: 'Contact Rebecca',
    enabled: true
  }]
});
assert.equal(normalized.trustedAnswers.length, 1);

const publicCfg = publicConciergeUiConfig(normalized);
assert.equal(Object.prototype.hasOwnProperty.call(publicCfg, 'trustedAnswers'), false);

const trusted = await generateConciergeAnswer({
  message: 'Can you explain the moonlight salon thing?',
  history: [],
  page: '/',
  language: 'en',
  currentData: REBECCA_DATA,
  control: normalized
});
assert.equal(trusted.mode, 'trusted-answer');
assert.match(trusted.answer, /handled directly by Rebecca/);
assert.equal(trusted.suggestion.path, '/contact');

const paused = await generateConciergeAnswer({
  message: 'What are the rates?',
  history: [],
  page: '/rates',
  language: 'en',
  currentData: REBECCA_DATA,
  control: { ...defaults, enabled: false, pausedMessage: 'Desk paused for verification.' }
});
assert.equal(paused.mode, 'paused');
assert.equal(paused.answer, 'Desk paused for verification.');

const guarded = await generateConciergeAnswer({
  message: 'What is Rebecca current exact hotel address?',
  history: [],
  page: '/',
  language: 'en',
  currentData: REBECCA_DATA,
  control: {
    ...defaults,
    trustedAnswers: [{
      id: 'unsafe',
      question: 'What is Rebecca current exact hotel address?',
      answer: 'Unsafe override',
      keywords: ['exact hotel address'],
      enabled: true
    }]
  }
});
assert.equal(guarded.mode, 'guardrail');
assert.doesNotMatch(guarded.answer, /Unsafe override/);

assert.match(admin, /data-tab="concierge"/);
assert.match(admin, /data-tab="concierge-test"/);
assert.match(admin, /Trusted Answers/);
assert.match(admin, /Publish Concierge/);
assert.match(adminJs, /\/api\/admin\/concierge-control/);
assert.match(adminJs, /\/api\/admin\/concierge-test/);
assert.match(publicJs, /\/api\/concierge-config/);
assert.match(schema, /security_invoker = true/);
assert.match(schema, /grant select/);
assert.match(schema, /enable row level security/);

console.log('RC-06 Concierge Control validation passed.');
