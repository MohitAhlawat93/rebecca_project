export const LIVE_TIMEZONE = 'Asia/Singapore';

const isDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

export function liveDateKey(value = new Date(), timeZone = LIVE_TIMEZONE) {
  if (typeof value === 'string' && isDateKey(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(safe);
  const get = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function publicPagePath(pathname = '/') {
  const clean = String(pathname || '/').replace(/\/$/, '') || '/';
  return clean.replace(/^\/(zh|hi|fr|es)(?=\/|$)/, '') || '/';
}

export function publicTravelLifecycle(item = {}, now = new Date()) {
  const start = isDateKey(item.startDate) ? item.startDate : null;
  const end = isDateKey(item.endDate) ? item.endDate : null;
  if (!start || !end || end < start) return item.lifecycle || 'manual';
  const today = liveDateKey(now);
  if (today < start) return 'upcoming';
  if (today > end) return 'past';
  return 'current';
}

export function travelGroups(travel = {}, now = new Date()) {
  const calendar = Array.isArray(travel.calendar) ? travel.calendar : [];
  const visible = calendar.filter((item) => item?.visible !== false).map((item) => ({
    ...item,
    lifecycle: publicTravelLifecycle(item, now)
  }));
  return {
    upcoming: visible.filter((item) => ['upcoming', 'current', 'manual'].includes(item.lifecycle)),
    past: visible.filter((item) => item.lifecycle === 'past'),
    interest: (Array.isArray(travel.expressionsOfInterest) ? travel.expressionsOfInterest : [])
      .filter((item) => item?.visible !== false)
  };
}

export function activeNotices(notices = [], { now = new Date(), pathname = '/' } = {}) {
  const today = liveDateKey(now);
  const path = publicPagePath(pathname);
  return (Array.isArray(notices) ? notices : [])
    .filter((notice) => {
      if (!notice || notice.enabled === false) return false;
      if (isDateKey(notice.startDate) && today < notice.startDate) return false;
      if (isDateKey(notice.expiryDate) && today > notice.expiryDate) return false;
      const pages = Array.isArray(notice.pages) && notice.pages.length ? notice.pages : ['*'];
      return pages.includes('*') || pages.map(publicPagePath).includes(path);
    })
    .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
}

export function mapLocationsForDisplay(travel = {}, now = new Date()) {
  const calendar = Array.isArray(travel.calendar) ? travel.calendar : [];
  const byId = new Map(calendar.map((item) => [item.id, { ...item, lifecycle: publicTravelLifecycle(item, now) }]));
  return (Array.isArray(travel.mapLocations) ? travel.mapLocations : []).filter((location) => {
    if (!location || location.enabled === false) return false;
    if (!location.tourId) return true;
    const trip = byId.get(location.tourId);
    if (!trip || trip.visible === false) return false;
    if ((location.categories || []).includes('upcoming-tour')) return trip.lifecycle !== 'past';
    return true;
  });
}
