import assert from 'node:assert/strict';
import {
  addDaysToDateKey,
  dateKeyInTimeZone,
  evaluateQuickControlSchedules,
  travelLifecycle
} from '../lib/schedule-engine.js';
import {
  applyQuickControlState,
  buildDefaultQuickControlState,
  normalizeQuickControlState
} from '../lib/admin-store.js';
import { REBECCA_DATA } from '../data/rebecca-data.js';

assert.equal(dateKeyInTimeZone('2026-10-18T15:59:59Z'), '2026-10-18');
assert.equal(dateKeyInTimeZone('2026-10-18T16:00:00Z'), '2026-10-19');
assert.equal(addDaysToDateKey('2026-10-31', 1), '2026-11-01');

const defaults = buildDefaultQuickControlState();
const limited = normalizeQuickControlState({
  ...defaults,
  availability: {
    status: 'limited',
    label: 'Limited availability',
    message: 'Only a few dates remain.',
    until: '2026-10-18',
    revertStatus: 'accepting',
    revertMessage: ''
  }
}, defaults);

const stillLimited = evaluateQuickControlSchedules(limited, {
  now: new Date('2026-10-18T15:59:59Z')
});
assert.equal(stillLimited.state.availability.status, 'limited');
assert.equal(stillLimited.state.availability.until, '2026-10-18');
assert.equal(stillLimited.schedule.nextChanges[0].kind, 'availability_revert');
assert.equal(stillLimited.schedule.nextChanges[0].date, '2026-10-19');

const reverted = evaluateQuickControlSchedules(limited, {
  now: new Date('2026-10-18T16:00:00Z')
});
assert.equal(reverted.state.availability.status, 'accepting');
assert.equal(reverted.state.availability.label, 'Accepting enquiries');
assert.equal(reverted.state.availability.until, null);
assert.ok(reverted.schedule.appliedChanges.some((item) => item.kind === 'availability_reverted'));

const india = defaults.travel.find((item) => item.id === 'india-nov-2026');
assert.ok(india);
assert.equal(india.startDate, '2026-11-10');
assert.equal(india.endDate, '2026-11-30');
assert.equal(travelLifecycle(india, new Date('2026-11-09T08:00:00Z')), 'upcoming');
assert.equal(travelLifecycle(india, new Date('2026-11-10T08:00:00Z')), 'current');
assert.equal(travelLifecycle(india, new Date('2026-11-30T08:00:00Z')), 'current');
assert.equal(travelLifecycle(india, new Date('2026-12-01T08:00:00Z')), 'past');

const beforeTrip = evaluateQuickControlSchedules(defaults, {
  now: new Date('2026-11-09T08:00:00Z')
});
const indiaBefore = beforeTrip.state.travel.find((item) => item.id === 'india-nov-2026');
assert.equal(indiaBefore.lifecycle, 'upcoming');
assert.equal(indiaBefore.publicVisible, true);
assert.ok(beforeTrip.schedule.nextChanges.some((item) => item.kind === 'travel_start' && item.id === 'india-nov-2026'));

const duringTrip = evaluateQuickControlSchedules(defaults, {
  now: new Date('2026-11-15T08:00:00Z')
});
assert.equal(duringTrip.state.travel.find((item) => item.id === 'india-nov-2026').lifecycle, 'current');
assert.equal(duringTrip.schedule.travelCounts.current, 1);

const afterTrip = evaluateQuickControlSchedules(defaults, {
  now: new Date('2026-12-08T08:00:00Z')
});
assert.equal(afterTrip.state.travel.find((item) => item.id === 'india-nov-2026').lifecycle, 'past');
assert.equal(afterTrip.state.travel.find((item) => item.id === 'india-nov-2026').publicVisible, false);
assert.equal(afterTrip.state.travel.find((item) => item.id === 'london-europe-dec-2026').lifecycle, 'past');

const publicData = applyQuickControlState(REBECCA_DATA, defaults, {
  now: new Date('2026-12-08T08:00:00Z')
});
assert.equal(publicData.travel.calendar.find((item) => item.id === 'india-nov-2026').visible, false);
assert.equal(publicData.travel.calendar.find((item) => item.id === 'london-europe-dec-2026').visible, false);
assert.equal('until' in publicData.availability, false);
assert.equal('revertStatus' in publicData.availability, false);
assert.equal('startDate' in publicData.travel.calendar[0], false);
assert.equal('lifecycle' in publicData.travel.calendar[0], false);

console.log('RC-04 scheduling validation passed.');
