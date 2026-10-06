import assert from 'node:assert/strict';
import {
  adminStoreConfigured,
  applyQuickControlState,
  buildDefaultQuickControlState,
  getEffectiveRebeccaData,
  normalizeQuickControlState
} from '../lib/admin-store.js';
import { REBECCA_DATA, formatSingaporeRatesCompact } from '../data/rebecca-data.js';
import { retrieveRebeccaKnowledge } from '../lib/rebecca-knowledge.js';

delete process.env.RC_SUPABASE_URL;
delete process.env.RC_SUPABASE_PUBLISHABLE_KEY;
delete process.env.RC_STORE_SECRET;

assert.equal(adminStoreConfigured(), false);

process.env.RC_SUPABASE_URL = 'https://example.supabase.co';
process.env.RC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
process.env.RC_STORE_SECRET = 'test-only-secret';
assert.equal(adminStoreConfigured(), true);
delete process.env.RC_SUPABASE_URL;
delete process.env.RC_SUPABASE_PUBLISHABLE_KEY;
delete process.env.RC_STORE_SECRET;

const defaults = buildDefaultQuickControlState();
assert.equal(defaults.availability.status, 'accepting');
assert.ok(defaults.rates.length >= 1);
assert.ok(defaults.travel.length >= 1);

const edited = normalizeQuickControlState({
  ...defaults,
  availability: {
    status: 'limited',
    label: 'Limited availability',
    message: 'A small number of dates are open.',
    until: '2026-12-31'
  },
  profile: {
    ...defaults.profile,
    base: 'Test City',
    languages: ['English', 'Mandarin', 'French']
  },
  rates: defaults.rates.map((rate, index) => ({
    ...rate,
    amount: index === 0 ? 9999 : rate.amount,
    visible: index !== 1
  })),
  travel: defaults.travel.map((trip, index) => ({
    ...trip,
    visible: index !== 0
  }))
}, defaults);

const effective = applyQuickControlState(REBECCA_DATA, edited);
assert.equal(effective.availability.status, 'limited');
assert.equal(effective.profile.base, 'Test City');
assert.equal(effective.profile.languages.join(','), 'English,Mandarin,French');
assert.equal(effective.singapore.rates[0].amount, 9999);
assert.equal(effective.singapore.rates[1].visible, false);
assert.equal(effective.travel.calendar[0].visible, false);
assert.match(
  effective.profile.homeFacts.find((item) => item.label === 'Base').value,
  /Test City/
);

const compactRates = formatSingaporeRatesCompact(effective);
assert.match(compactRates, /9,999/);
assert.ok(!compactRates.includes(effective.singapore.rates[1].short + ' '));

const rateKnowledge = retrieveRebeccaKnowledge('Singapore rates', 2, effective);
assert.ok(rateKnowledge.some((chunk) => chunk.id === 'singapore-rates'));

const fallback = await getEffectiveRebeccaData();
assert.equal(fallback.storeMode, 'canonical-fallback');
assert.equal(fallback.persistent, false);
assert.ok(fallback.data.profile.displayName);

console.log('RC-02 Quick Control validation passed.');
