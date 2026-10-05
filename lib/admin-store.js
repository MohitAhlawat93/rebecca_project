import { REBECCA_DATA } from '../data/rebecca-data.js';

const STORE_ID = 'current';
const STATUS_OPTIONS = new Set(['accepting', 'limited', 'travelling', 'away', 'unavailable']);

const STATUS_LABELS = {
  accepting: 'Accepting enquiries',
  limited: 'Limited availability',
  travelling: 'Travelling',
  away: 'Temporarily away',
  unavailable: 'Not accepting enquiries'
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function cleanText(value, max = 240) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanNullableText(value, max = 240) {
  const text = cleanText(value, max);
  return text || null;
}

function cleanStringArray(value, maxItems = 20, maxLength = 80) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((item) => cleanText(item, maxLength))
    .filter(Boolean);
}

function slug(value = '') {
  return cleanText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function toOptionalNumber(value, fallback = null) {
  if (value === null || value === '' || typeof value === 'undefined') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1000000) return fallback;
  return Math.round(parsed);
}

function normalizeUrl(value, fallback = '') {
  const text = cleanText(value, 500);
  if (!text) return fallback;
  try {
    const url = new URL(text);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function normalizeEmail(value, fallback = '') {
  const text = cleanText(value, 180);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : fallback;
}

export function buildDefaultQuickControlState() {
  return {
    availability: {
      status: 'accepting',
      label: STATUS_LABELS.accepting,
      message: 'Currently accepting enquiries.',
      until: null
    },
    profile: {
      displayName: REBECCA_DATA.profile.displayName,
      base: REBECCA_DATA.profile.base,
      secondaryBase: REBECCA_DATA.profile.secondaryBase,
      age: REBECCA_DATA.profile.age,
      heightMetric: REBECCA_DATA.profile.height.metric,
      heightImperial: REBECCA_DATA.profile.height.imperial,
      heritage: REBECCA_DATA.profile.heritage,
      languages: clone(REBECCA_DATA.profile.languages)
    },
    rates: REBECCA_DATA.singapore.rates.map((rate, index) => ({
      id: rate.id || slug(rate.short || rate.label || String(index + 1)),
      label: rate.label,
      short: rate.short,
      amount: rate.amount,
      display: rate.display || '',
      category: rate.category || '',
      note: rate.note || '',
      featured: Boolean(rate.featured),
      visible: rate.visible !== false
    })),
    travel: REBECCA_DATA.travel.calendar.map((item, index) => ({
      id: cleanText(item.id || slug(item.title || String(index + 1)), 100),
      kicker: cleanText(item.kicker, 140),
      dateRange: cleanText(item.dateRange, 140),
      title: cleanText(item.title, 180),
      cities: cleanStringArray(item.cities, 20, 80),
      body: cleanText(item.body, 800),
      meta: cleanStringArray(item.meta, 12, 140),
      alt: Boolean(item.alt),
      visible: item.visible !== false
    })),
    contact: {
      phoneDisplay: REBECCA_DATA.contact.phoneDisplay,
      whatsappUrl: REBECCA_DATA.contact.whatsappUrl,
      telegramHandle: REBECCA_DATA.contact.telegramHandle,
      telegramUrl: REBECCA_DATA.contact.telegramUrl,
      email: REBECCA_DATA.contact.email,
      telegramChannelLabel: REBECCA_DATA.contact.telegramChannelLabel,
      telegramChannelUrl: REBECCA_DATA.contact.telegramChannelUrl
    }
  };
}

export function normalizeQuickControlState(input = {}, fallback = buildDefaultQuickControlState()) {
  const status = STATUS_OPTIONS.has(input?.availability?.status)
    ? input.availability.status
    : fallback.availability.status;

  const ratesInput = Array.isArray(input.rates) ? input.rates : fallback.rates;
  const travelInput = Array.isArray(input.travel) ? input.travel : fallback.travel;

  const rates = ratesInput.slice(0, 30).map((rate, index) => {
    const base = fallback.rates.find((item) => item.id === rate?.id) || fallback.rates[index] || {};
    return {
      id: cleanText(rate?.id || base.id || slug(rate?.short || rate?.label || String(index + 1)), 100),
      label: cleanText(rate?.label || base.label, 100),
      short: cleanText(rate?.short || base.short, 60),
      amount: toOptionalNumber(rate?.amount, base.amount ?? null),
      display: cleanText(rate?.display ?? base.display, 80),
      category: cleanText(rate?.category ?? base.category, 100),
      note: cleanText(rate?.note ?? base.note, 180),
      featured: Boolean(rate?.featured),
      visible: rate?.visible !== false
    };
  });

  const travel = travelInput.slice(0, 20).map((item, index) => ({
    id: cleanText(item?.id || slug(item?.title || String(index + 1)), 100),
    kicker: cleanText(item?.kicker, 140),
    dateRange: cleanText(item?.dateRange, 140),
    title: cleanText(item?.title, 180),
    cities: cleanStringArray(item?.cities, 20, 80),
    body: cleanText(item?.body, 800),
    meta: cleanStringArray(item?.meta, 12, 140),
    alt: Boolean(item?.alt),
    visible: item?.visible !== false
  })).filter((item) => item.id && item.title);

  const profile = input.profile || {};
  const contact = input.contact || {};

  return {
    availability: {
      status,
      label: cleanText(input?.availability?.label, 100) || STATUS_LABELS[status],
      message: cleanText(input?.availability?.message, 280) || fallback.availability.message,
      until: cleanNullableText(input?.availability?.until, 40)
    },
    profile: {
      displayName: cleanText(profile.displayName, 100) || fallback.profile.displayName,
      base: cleanText(profile.base, 100) || fallback.profile.base,
      secondaryBase: cleanText(profile.secondaryBase, 120) || fallback.profile.secondaryBase,
      age: cleanText(profile.age, 60) || fallback.profile.age,
      heightMetric: cleanText(profile.heightMetric, 40) || fallback.profile.heightMetric,
      heightImperial: cleanText(profile.heightImperial, 40) || fallback.profile.heightImperial,
      heritage: cleanText(profile.heritage, 100) || fallback.profile.heritage,
      languages: cleanStringArray(profile.languages, 10, 60).length
        ? cleanStringArray(profile.languages, 10, 60)
        : clone(fallback.profile.languages)
    },
    rates,
    travel,
    contact: {
      phoneDisplay: cleanText(contact.phoneDisplay, 80) || fallback.contact.phoneDisplay,
      whatsappUrl: normalizeUrl(contact.whatsappUrl, fallback.contact.whatsappUrl),
      telegramHandle: cleanText(contact.telegramHandle, 80) || fallback.contact.telegramHandle,
      telegramUrl: normalizeUrl(contact.telegramUrl, fallback.contact.telegramUrl),
      email: normalizeEmail(contact.email, fallback.contact.email),
      telegramChannelLabel: cleanText(contact.telegramChannelLabel, 100) || fallback.contact.telegramChannelLabel,
      telegramChannelUrl: normalizeUrl(contact.telegramChannelUrl, fallback.contact.telegramChannelUrl)
    }
  };
}

export function adminStoreConfigured() {
  return Boolean(
    String(process.env.RC_SUPABASE_URL || '').trim() &&
    String(process.env.RC_SUPABASE_SECRET_KEY || '').trim()
  );
}

function supabaseHeaders(extra = {}) {
  const secret = String(process.env.RC_SUPABASE_SECRET_KEY || '').trim();
  const headers = {
    apikey: secret,
    'Content-Type': 'application/json'
  };

  // New sb_secret_* keys are opaque API keys and should be sent through
  // the apikey header. Legacy service_role JWT keys also need Bearer auth.
  if (secret && !secret.startsWith('sb_secret_')) {
    headers.Authorization = 'Bearer ' + secret;
  }

  return { ...headers, ...extra };
}

async function supabaseFetch(path, options = {}) {
  if (!adminStoreConfigured()) throw new Error('Rebecca Control content storage is not configured.');
  const root = String(process.env.RC_SUPABASE_URL || '').replace(/\/$/, '');
  const response = await fetch(root + path, {
    ...options,
    headers: supabaseHeaders(options.headers || {}),
    cache: 'no-store'
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error('Rebecca Control storage request failed (' + response.status + ')' + (details ? ': ' + details.slice(0, 240) : ''));
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function readQuickControlState() {
  const defaults = buildDefaultQuickControlState();

  if (!adminStoreConfigured()) {
    return {
      state: defaults,
      version: 0,
      updatedAt: null,
      storeMode: 'canonical-fallback',
      persistent: false
    };
  }

  try {
    const rows = await supabaseFetch(
      '/rest/v1/rebecca_control_state?id=eq.' + STORE_ID + '&select=id,version,payload,updated_at&limit=1',
      { method: 'GET' }
    );

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.payload) {
      return {
        state: defaults,
        version: 0,
        updatedAt: null,
        storeMode: 'supabase-empty',
        persistent: true
      };
    }

    return {
      state: normalizeQuickControlState(row.payload, defaults),
      version: Number(row.version) || 0,
      updatedAt: row.updated_at || null,
      storeMode: 'supabase',
      persistent: true
    };
  } catch (error) {
    console.error('Rebecca Control read fallback:', error?.message || error);
    return {
      state: defaults,
      version: 0,
      updatedAt: null,
      storeMode: 'canonical-fallback-error',
      persistent: false
    };
  }
}

export async function writeQuickControlState(input, updatedBy = 'Rebecca') {
  if (!adminStoreConfigured()) {
    const error = new Error('Persistent content storage is not configured yet.');
    error.code = 'STORE_NOT_CONFIGURED';
    throw error;
  }

  const current = await readQuickControlState();
  const nextState = normalizeQuickControlState(input, current.state);
  const nextVersion = Math.max(0, Number(current.version) || 0) + 1;

  const rows = await supabaseFetch('/rest/v1/rebecca_control_state?on_conflict=id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify([{
      id: STORE_ID,
      version: nextVersion,
      payload: nextState,
      updated_by: cleanText(updatedBy, 120) || 'Rebecca',
      updated_at: new Date().toISOString()
    }])
  });

  const row = Array.isArray(rows) ? rows[0] : null;

  return {
    state: nextState,
    version: Number(row?.version) || nextVersion,
    updatedAt: row?.updated_at || new Date().toISOString(),
    storeMode: 'supabase',
    persistent: true
  };
}

function replaceFact(facts = [], label, value) {
  return facts.map((item) => item?.label === label ? { ...item, value } : item);
}

export function applyQuickControlState(baseData, state) {
  const data = clone(baseData);
  const quick = normalizeQuickControlState(state, buildDefaultQuickControlState());

  data.availability = clone(quick.availability);

  Object.assign(data.profile, {
    displayName: quick.profile.displayName,
    base: quick.profile.base,
    secondaryBase: quick.profile.secondaryBase,
    age: quick.profile.age,
    heritage: quick.profile.heritage,
    languages: clone(quick.profile.languages)
  });
  data.profile.height = {
    metric: quick.profile.heightMetric,
    imperial: quick.profile.heightImperial
  };

  data.profile.homeFacts = replaceFact(data.profile.homeFacts, 'Base', [quick.profile.base, quick.profile.secondaryBase].filter(Boolean).join(' · '));
  data.profile.homeFacts = replaceFact(data.profile.homeFacts, 'Age', quick.profile.age);
  data.profile.homeFacts = replaceFact(data.profile.homeFacts, 'Height', quick.profile.heightMetric + ' · ' + quick.profile.heightImperial);
  data.profile.homeFacts = replaceFact(data.profile.homeFacts, 'Heritage', quick.profile.heritage);
  data.profile.homeFacts = replaceFact(data.profile.homeFacts, 'Languages', quick.profile.languages.join(' · '));

  data.profile.aboutFacts = replaceFact(data.profile.aboutFacts, 'Base', [quick.profile.base, quick.profile.secondaryBase].filter(Boolean).join(' · '));
  data.profile.aboutFacts = replaceFact(data.profile.aboutFacts, 'Age', quick.profile.age);
  data.profile.aboutFacts = replaceFact(data.profile.aboutFacts, 'Height', quick.profile.heightMetric + ' · ' + quick.profile.heightImperial);
  data.profile.aboutFacts = replaceFact(data.profile.aboutFacts, 'Heritage', quick.profile.heritage);
  data.profile.aboutFacts = replaceFact(data.profile.aboutFacts, 'Languages', quick.profile.languages.join(' · '));

  data.singapore.rates = clone(quick.rates);
  data.travel.calendar = clone(quick.travel);
  data.contact = {
    ...data.contact,
    ...clone(quick.contact)
  };

  return data;
}

export async function getEffectiveRebeccaData() {
  const stored = await readQuickControlState();
  return {
    data: applyQuickControlState(REBECCA_DATA, stored.state),
    ...stored
  };
}

export async function getAdminDashboardSnapshot() {
  const stored = await readQuickControlState();
  const effective = applyQuickControlState(REBECCA_DATA, stored.state);
  return {
    dataVersion: effective.meta?.dataVersion || '—',
    lastVerified: effective.meta?.lastVerified || '—',
    base: effective.profile?.base || '—',
    singaporeRateCount: Array.isArray(effective.singapore?.rates)
      ? effective.singapore.rates.filter((item) => item.visible !== false).length
      : 0,
    travelWindowCount: Array.isArray(effective.travel?.calendar)
      ? effective.travel.calendar.filter((item) => item.visible !== false).length
      : 0,
    availability: effective.availability,
    storeMode: stored.storeMode,
    persistent: stored.persistent,
    version: stored.version,
    updatedAt: stored.updatedAt
  };
}
