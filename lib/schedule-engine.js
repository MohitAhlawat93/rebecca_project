export const SCHEDULE_TIMEZONE = 'Asia/Singapore';

export const AVAILABILITY_STATUS_LABELS = {
  accepting: 'Accepting enquiries',
  limited: 'Limited availability',
  travelling: 'Travelling',
  away: 'Temporarily away',
  unavailable: 'Not accepting enquiries'
};

export const AVAILABILITY_STATUS_MESSAGES = {
  accepting: 'Currently accepting enquiries.',
  limited: 'Availability is limited, so early enquiries are appreciated.',
  travelling: 'Currently travelling. Please check the Travel page before enquiring.',
  away: 'Temporarily away. Replies may be slower than usual.',
  unavailable: 'Not currently accepting new enquiries.'
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export function isDateKey(value) {
  const text = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function dateKeyInTimeZone(value = new Date(), timeZone = SCHEDULE_TIMEZONE) {
  if (typeof value === 'string' && isDateKey(value)) return value;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return dateKeyInTimeZone(new Date(), timeZone);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDaysToDateKey(value, days = 1) {
  if (!isDateKey(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
}

export function travelLifecycle(item = {}, now = new Date(), timeZone = SCHEDULE_TIMEZONE) {
  const startDate = isDateKey(item.startDate) ? item.startDate : null;
  const endDate = isDateKey(item.endDate) ? item.endDate : null;

  if (!startDate || !endDate || endDate < startDate) return 'manual';

  const today = dateKeyInTimeZone(now, timeZone);
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'past';
  return 'current';
}

function scheduleEvent(kind, date, title, detail = '', meta = {}) {
  return {
    id: [kind, meta.id || title, date].filter(Boolean).join(':'),
    kind,
    date,
    title,
    detail,
    ...meta
  };
}

export function evaluateQuickControlSchedules(
  state,
  { now = new Date(), timeZone = SCHEDULE_TIMEZONE } = {}
) {
  const raw = clone(state || {});
  const effective = clone(raw);
  const today = dateKeyInTimeZone(now, timeZone);
  const nextChanges = [];
  const appliedChanges = [];

  const availability = effective.availability || {};
  const until = isDateKey(availability.until) ? availability.until : null;
  const revertStatus = AVAILABILITY_STATUS_LABELS[availability.revertStatus]
    ? availability.revertStatus
    : 'accepting';
  const revertLabel = AVAILABILITY_STATUS_LABELS[revertStatus];
  const revertMessage = String(availability.revertMessage || '').trim()
    || AVAILABILITY_STATUS_MESSAGES[revertStatus];

  if (until) {
    const revertDate = addDaysToDateKey(until, 1);
    if (today > until) {
      appliedChanges.push(scheduleEvent(
        'availability_reverted',
        revertDate,
        `Availability returned to ${revertLabel}`,
        `The temporary “${availability.label || AVAILABILITY_STATUS_LABELS[availability.status] || 'availability'}” status expired after ${until}.`
      ));

      effective.availability = {
        ...availability,
        status: revertStatus,
        label: revertLabel,
        message: revertMessage,
        until: null,
        revertStatus: 'accepting',
        revertMessage: ''
      };
    } else {
      nextChanges.push(scheduleEvent(
        'availability_revert',
        revertDate,
        `Availability returns to ${revertLabel}`,
        `Current status stays active through ${until}.`
      ));
    }
  }

  const travel = Array.isArray(effective.travel) ? effective.travel : [];
  const travelCounts = { upcoming: 0, current: 0, past: 0, manual: 0 };

  effective.travel = travel.map((trip) => {
    const lifecycle = travelLifecycle(trip, now, timeZone);
    travelCounts[lifecycle] = (travelCounts[lifecycle] || 0) + 1;

    const next = { ...trip, lifecycle };
    if (lifecycle === 'past') {
      next.autoArchived = true;
      next.publicVisible = trip.visible !== false;
    } else {
      next.autoArchived = false;
      next.publicVisible = trip.visible !== false;
    }

    if (lifecycle === 'upcoming') {
      nextChanges.push(scheduleEvent(
        'travel_start',
        trip.startDate,
        `${trip.title || trip.cities?.[0] || 'Trip'} becomes Current`,
        trip.cities?.length ? trip.cities.join(' · ') : '',
        { id: trip.id }
      ));
      nextChanges.push(scheduleEvent(
        'travel_archive',
        addDaysToDateKey(trip.endDate, 1),
        `${trip.title || trip.cities?.[0] || 'Trip'} moves to Past`,
        'It will move into the public Past archive automatically; this never indicates Rebecca’s current location.',
        { id: trip.id }
      ));
    } else if (lifecycle === 'current') {
      nextChanges.push(scheduleEvent(
        'travel_archive',
        addDaysToDateKey(trip.endDate, 1),
        `${trip.title || trip.cities?.[0] || 'Trip'} moves to Past`,
        'It will move into the public Past archive automatically; this never indicates Rebecca’s current location.',
        { id: trip.id }
      ));
    } else if (lifecycle === 'past') {
      appliedChanges.push(scheduleEvent(
        'travel_archived',
        addDaysToDateKey(trip.endDate, 1),
        `${trip.title || trip.cities?.[0] || 'Trip'} is now Past`,
        'It is retained as a past public tour window; this is historical information, not a current-location signal.',
        { id: trip.id }
      ));
    }

    return next;
  });

  nextChanges.sort((a, b) => {
    if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
    return String(a.kind).localeCompare(String(b.kind));
  });

  appliedChanges.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return {
    state: effective,
    schedule: {
      timeZone,
      today,
      nextChanges,
      appliedChanges,
      travelCounts
    }
  };
}
