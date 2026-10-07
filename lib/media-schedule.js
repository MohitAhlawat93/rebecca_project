import { normalizeMediaState } from './media-store.js';

export const MEDIA_SCHEDULE_TIMEZONE = 'Asia/Singapore';

const clone = (value) => JSON.parse(JSON.stringify(value));

function cleanText(value, max = 240) {
  return String(value ?? '').trim().slice(0, max);
}

export function parseSingaporeLocalDateTime(value) {
  const text = cleanText(value, 40);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (
    year < 2000 || year > 2100 ||
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) return null;

  const utc = new Date(Date.UTC(year, month - 1, day, hour - 8, minute, 0, 0));
  const singaporeCheck = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEDIA_SCHEDULE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(utc);

  const part = (type) => singaporeCheck.find((item) => item.type === type)?.value || '';
  const roundTrip = `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
  return roundTrip === text ? utc.toISOString() : null;
}

export function singaporeLocalFromIso(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEDIA_SCHEDULE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export function normalizeMediaSchedule(input, fallbackState) {
  if (!input || typeof input !== 'object' || !input.publishAt) return null;

  const publishAt = new Date(input.publishAt);
  if (Number.isNaN(publishAt.getTime())) return null;

  const expireAt = input.expireAt ? new Date(input.expireAt) : null;
  if (expireAt && Number.isNaN(expireAt.getTime())) return null;
  if (expireAt && expireAt <= publishAt) return null;

  const scheduledState = normalizeMediaState(input.state || {}, fallbackState);
  const fallbackPublishedState = normalizeMediaState(input.fallbackState || fallbackState, fallbackState);

  return {
    id: cleanText(input.id, 120) || 'media-schedule-' + publishAt.getTime(),
    timeZone: MEDIA_SCHEDULE_TIMEZONE,
    publishAt: publishAt.toISOString(),
    publishLocal: singaporeLocalFromIso(publishAt),
    expireAt: expireAt ? expireAt.toISOString() : null,
    expireLocal: expireAt ? singaporeLocalFromIso(expireAt) : null,
    state: scheduledState,
    fallbackState: fallbackPublishedState,
    fallbackPublishedVersion: Math.max(0, Number(input.fallbackPublishedVersion) || 0),
    createdAt: cleanText(input.createdAt, 60) || new Date().toISOString(),
    createdBy: cleanText(input.createdBy, 120) || 'Rebecca'
  };
}

export function mediaSchedulePhase(schedule, now = new Date()) {
  if (!schedule) return 'none';
  const normalizedNow = now instanceof Date ? now : new Date(now);
  const nowMs = normalizedNow.getTime();
  if (Number.isNaN(nowMs)) return 'none';

  const publishMs = new Date(schedule.publishAt).getTime();
  if (Number.isNaN(publishMs)) return 'none';
  if (nowMs < publishMs) return 'pending';

  if (schedule.expireAt) {
    const expireMs = new Date(schedule.expireAt).getTime();
    if (!Number.isNaN(expireMs) && nowMs >= expireMs) return 'expired';
  }
  return 'active';
}

export function evaluateMediaSchedule(mediaState, now = new Date()) {
  const current = mediaState || {};
  const published = normalizeMediaState(current.published || {});
  const schedule = normalizeMediaSchedule(current.schedule, published);
  const phase = mediaSchedulePhase(schedule, now);

  if (!schedule || phase === 'none' || phase === 'pending') {
    return {
      state: published,
      phase,
      schedule,
      effectiveVersion: current.publishedVersion || 0,
      effectivePublishedAt: current.publishedAt || null
    };
  }

  if (phase === 'active') {
    return {
      state: clone(schedule.state),
      phase,
      schedule,
      effectiveVersion: 'scheduled:' + schedule.id,
      effectivePublishedAt: schedule.publishAt
    };
  }

  return {
    state: clone(schedule.fallbackState),
    phase: 'expired',
    schedule,
    effectiveVersion: schedule.fallbackPublishedVersion,
    effectivePublishedAt: schedule.expireAt
  };
}

export function buildMediaSchedule({
  draft,
  published,
  publishedVersion = 0,
  publishLocal,
  expireLocal = null,
  now = new Date(),
  createdBy = 'Rebecca'
}) {
  const publishAt = parseSingaporeLocalDateTime(publishLocal);
  if (!publishAt) {
    const error = new Error('Choose a valid Singapore publish date and time.');
    error.code = 'MEDIA_SCHEDULE_INVALID';
    throw error;
  }

  const nowDate = now instanceof Date ? now : new Date(now);
  if (publishAt <= nowDate) {
    const error = new Error('Scheduled publish time must be in the future.');
    error.code = 'MEDIA_SCHEDULE_INVALID';
    throw error;
  }

  let expireAt = null;
  if (expireLocal) {
    expireAt = parseSingaporeLocalDateTime(expireLocal);
    if (!expireAt || expireAt <= publishAt) {
      const error = new Error('Expiry must be later than the scheduled publish time.');
      error.code = 'MEDIA_SCHEDULE_INVALID';
      throw error;
    }
  }

  const normalizedDraft = normalizeMediaState(draft);
  const normalizedPublished = normalizeMediaState(published);

  return normalizeMediaSchedule({
    id: 'media-schedule-' + publishAt.getTime(),
    publishAt,
    expireAt,
    state: normalizedDraft,
    fallbackState: normalizedPublished,
    fallbackPublishedVersion: publishedVersion,
    createdAt: nowDate.toISOString(),
    createdBy
  }, normalizedPublished);
}
