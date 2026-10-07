import assert from 'node:assert/strict';
import {
  buildMediaSchedule,
  evaluateMediaSchedule,
  mediaSchedulePhase,
  parseSingaporeLocalDateTime,
  singaporeLocalFromIso
} from '../lib/media-schedule.js';
import {
  buildDefaultMediaState,
  normalizeMediaState
} from '../lib/media-store.js';

const defaults = buildDefaultMediaState();
const draft = normalizeMediaState(defaults);
draft.placements.hero = [...draft.placements.hero].reverse();

assert.equal(
  parseSingaporeLocalDateTime('2026-10-10T09:30'),
  '2026-10-10T01:30:00.000Z'
);
assert.equal(
  singaporeLocalFromIso('2026-10-10T01:30:00.000Z'),
  '2026-10-10T09:30'
);
assert.equal(parseSingaporeLocalDateTime('2026-02-30T09:30'), null);

const schedule = buildMediaSchedule({
  draft,
  published: defaults,
  publishedVersion: 7,
  publishLocal: '2026-10-10T09:30',
  expireLocal: '2026-10-10T18:00',
  now: new Date('2026-10-07T03:30:00.000Z'),
  createdBy: 'Rebecca'
});

assert.equal(schedule.publishAt, '2026-10-10T01:30:00.000Z');
assert.equal(schedule.expireAt, '2026-10-10T10:00:00.000Z');
assert.equal(schedule.fallbackPublishedVersion, 7);
assert.equal(mediaSchedulePhase(schedule, new Date('2026-10-10T01:29:59.999Z')), 'pending');
assert.equal(mediaSchedulePhase(schedule, new Date('2026-10-10T01:30:00.000Z')), 'active');
assert.equal(mediaSchedulePhase(schedule, new Date('2026-10-10T09:59:59.999Z')), 'active');
assert.equal(mediaSchedulePhase(schedule, new Date('2026-10-10T10:00:00.000Z')), 'expired');

const state = {
  draft,
  published: defaults,
  publishedVersion: 7,
  publishedAt: '2026-10-01T00:00:00.000Z',
  schedule
};

const before = evaluateMediaSchedule(state, new Date('2026-10-10T01:29:59.999Z'));
assert.equal(before.phase, 'pending');
assert.deepEqual(before.state.placements.hero, defaults.placements.hero);
assert.equal(before.effectiveVersion, 7);

const active = evaluateMediaSchedule(state, new Date('2026-10-10T01:30:00.000Z'));
assert.equal(active.phase, 'active');
assert.deepEqual(active.state.placements.hero, draft.placements.hero);
assert.match(String(active.effectiveVersion), /^scheduled:/);

const expired = evaluateMediaSchedule(state, new Date('2026-10-10T10:00:00.000Z'));
assert.equal(expired.phase, 'expired');
assert.deepEqual(expired.state.placements.hero, defaults.placements.hero);
assert.equal(expired.effectiveVersion, 7);

// The schedule must remain an immutable snapshot if the normal Draft changes later.
const laterDraft = normalizeMediaState(draft);
laterDraft.placements.hero = defaults.placements.hero.slice(0, 1);
assert.notDeepEqual(laterDraft.placements.hero, schedule.state.placements.hero);
assert.deepEqual(schedule.state.placements.hero, draft.placements.hero);

const noExpiry = buildMediaSchedule({
  draft,
  published: defaults,
  publishedVersion: 7,
  publishLocal: '2026-10-10T09:30',
  now: new Date('2026-10-07T03:30:00.000Z')
});
assert.equal(noExpiry.expireAt, null);
assert.equal(mediaSchedulePhase(noExpiry, new Date('2027-01-01T00:00:00.000Z')), 'active');

assert.throws(
  () => buildMediaSchedule({
    draft,
    published: defaults,
    publishLocal: '2026-10-06T09:30',
    now: new Date('2026-10-07T03:30:00.000Z')
  }),
  (error) => error?.code === 'MEDIA_SCHEDULE_INVALID'
);

assert.throws(
  () => buildMediaSchedule({
    draft,
    published: defaults,
    publishLocal: '2026-10-10T09:30',
    expireLocal: '2026-10-10T09:00',
    now: new Date('2026-10-07T03:30:00.000Z')
  }),
  (error) => error?.code === 'MEDIA_SCHEDULE_INVALID'
);

console.log('RC-04B scheduled publishing validation passed.');
