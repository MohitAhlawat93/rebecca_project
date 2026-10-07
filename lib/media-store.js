import { REBECCA_IMAGES } from '../data/rebecca-images.js';
import {
  buildMediaSchedule,
  evaluateMediaSchedule,
  mediaSchedulePhase,
  normalizeMediaSchedule
} from './media-schedule.js';

const STORE_ID = 'current';
export const MEDIA_PLACEMENTS = [
  { key: 'hero', label: 'Homepage rotation', max: 6 },
  { key: 'aboutFeature', label: 'About feature', max: 6 },
  { key: 'about', label: 'About editorial break', max: 6 },
  { key: 'reviews', label: 'Reviews', max: 6 },
  { key: 'travel', label: 'Travel', max: 6 },
  { key: 'favouritesHero', label: 'Favourites hero', max: 6 },
  { key: 'favourites', label: 'Favourites editorial', max: 6 },
  { key: 'journal', label: 'Journal hero', max: 6 },
  { key: 'press', label: 'Press hero', max: 6 },
  { key: 'galleryProfessional', label: 'Gallery · Professional preview', max: 6 },
  { key: 'galleryCandid', label: 'Gallery · Candid preview', max: 6 },
  { key: 'dateIdeas', label: 'Date ideas', max: 6 },
  { key: 'etiquette', label: 'Etiquette', max: 6 }
];

const PLACEMENT_KEYS = new Set(MEDIA_PLACEMENTS.map((item) => item.key));
const clone = (value) => JSON.parse(JSON.stringify(value));

function cleanText(value, max = 240) {
  return String(value ?? '').trim().slice(0, max);
}

function safeUrl(value) {
  const text = cleanText(value, 1000);
  try {
    const url = new URL(text);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function simpleHash(value = '') {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function filenameFromUrl(url = '') {
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split('/').filter(Boolean).pop() || 'Rebecca image');
    return name.slice(0, 160);
  } catch {
    return 'Rebecca image';
  }
}

function legacyItem(url) {
  return {
    id: 'legacy-' + simpleHash(url),
    url,
    pathname: null,
    name: filenameFromUrl(url),
    alt: 'Rebecca editorial portrait',
    source: 'legacy',
    createdAt: null
  };
}

export function buildDefaultMediaState() {
  const allUrls = [];
  for (const placement of MEDIA_PLACEMENTS) {
    for (const url of REBECCA_IMAGES.curated?.[placement.key] || []) {
      if (url && !allUrls.includes(url)) allUrls.push(url);
    }
  }

  const library = allUrls.map(legacyItem);
  const idByUrl = new Map(library.map((item) => [item.url, item.id]));
  const placements = {};

  for (const placement of MEDIA_PLACEMENTS) {
    placements[placement.key] = (REBECCA_IMAGES.curated?.[placement.key] || [])
      .map((url) => idByUrl.get(url))
      .filter(Boolean)
      .slice(0, placement.max);
  }

  return { library, placements };
}

export function normalizeMediaState(input = {}, fallback = buildDefaultMediaState()) {
  const incomingLibrary = Array.isArray(input.library) ? input.library : fallback.library;
  const seen = new Set();
  const library = [];

  for (const raw of incomingLibrary.slice(0, 250)) {
    const url = safeUrl(raw?.url);
    if (!url) continue;
    const id = cleanText(raw?.id, 120) || 'media-' + simpleHash(url);
    if (seen.has(id)) continue;
    seen.add(id);
    library.push({
      id,
      url,
      pathname: cleanText(raw?.pathname, 500) || null,
      name: cleanText(raw?.name, 160) || filenameFromUrl(url),
      alt: cleanText(raw?.alt, 220) || 'Rebecca editorial portrait',
      source: raw?.source === 'upload' ? 'upload' : 'legacy',
      createdAt: cleanText(raw?.createdAt, 60) || null
    });
  }

  const validIds = new Set(library.map((item) => item.id));
  const placements = {};

  for (const placement of MEDIA_PLACEMENTS) {
    const source = Array.isArray(input?.placements?.[placement.key])
      ? input.placements[placement.key]
      : (fallback.placements?.[placement.key] || []);

    placements[placement.key] = [...new Set(source)]
      .filter((id) => validIds.has(id))
      .slice(0, placement.max);
  }

  return { library, placements };
}

function hydrateMediaSchedule(rawSchedule, draft, published) {
  const normalized = normalizeMediaSchedule(rawSchedule, published);
  if (!normalized) return null;
  return {
    ...normalized,
    state: normalizeMediaState(normalized.state, draft),
    fallbackState: normalizeMediaState(normalized.fallbackState, published)
  };
}

export function addUploadedMedia(state, blob) {
  const current = normalizeMediaState(state);
  const url = safeUrl(blob?.url);
  if (!url) throw new Error('Uploaded image URL is invalid.');

  const existing = current.library.find((item) => item.url === url);
  if (existing) return current;

  current.library.unshift({
    id: 'upload-' + simpleHash(url + Date.now()),
    url,
    pathname: cleanText(blob?.pathname, 500) || null,
    name: cleanText(blob?.name || blob?.pathname, 160) || filenameFromUrl(url),
    alt: 'Rebecca editorial portrait',
    source: 'upload',
    createdAt: new Date().toISOString()
  });

  return normalizeMediaState(current);
}

export function applyMediaStateToImages(baseImages, state) {
  const images = clone(baseImages);
  const media = normalizeMediaState(state);
  const byId = new Map(media.library.map((item) => [item.id, item]));

  for (const placement of MEDIA_PLACEMENTS) {
    const urls = (media.placements[placement.key] || [])
      .map((id) => byId.get(id)?.url)
      .filter(Boolean);
    if (urls.length) images.curated[placement.key] = urls;
  }

  return images;
}

export function mediaStoreConfigured() {
  return Boolean(
    String(process.env.RC_SUPABASE_URL || '').trim() &&
    String(process.env.RC_SUPABASE_PUBLISHABLE_KEY || '').trim() &&
    String(process.env.RC_STORE_SECRET || '').trim()
  );
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: String(process.env.RC_SUPABASE_PUBLISHABLE_KEY || '').trim(),
    'x-rc-control-secret': String(process.env.RC_STORE_SECRET || '').trim(),
    'Content-Type': 'application/json',
    ...extra
  };
}

async function supabaseFetch(path, options = {}) {
  if (!mediaStoreConfigured()) throw new Error('Rebecca media storage is not configured.');
  const root = String(process.env.RC_SUPABASE_URL || '').replace(/\/$/, '');
  const response = await fetch(root + path, {
    ...options,
    headers: supabaseHeaders(options.headers || {}),
    cache: 'no-store'
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error('Rebecca media storage request failed (' + response.status + ')' + (details ? ': ' + details.slice(0, 220) : ''));
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function readMediaState() {
  const defaults = buildDefaultMediaState();

  if (!mediaStoreConfigured()) {
    return {
      draft: defaults,
      published: defaults,
      version: 0,
      publishedVersion: 0,
      history: [],
      schedule: null,
      updatedAt: null,
      publishedAt: null,
      persistent: false,
      storeMode: 'canonical-fallback'
    };
  }

  try {
    const rows = await supabaseFetch(
      '/rest/v1/rebecca_media_api?id=eq.' + STORE_ID + '&select=id,version,draft,published,published_version,history,schedule,updated_at,published_at&limit=1',
      { method: 'GET' }
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) throw new Error('Rebecca media state is not visible.');

    const rawDraft = row.draft && Object.keys(row.draft).length ? row.draft : defaults;
    const rawPublished = row.published && Object.keys(row.published).length ? row.published : defaults;

    return {
      draft: normalizeMediaState(rawDraft, defaults),
      published: normalizeMediaState(rawPublished, defaults),
      version: Number(row.version) || 0,
      publishedVersion: Number(row.published_version) || 0,
      history: Array.isArray(row.history) ? row.history.slice(0, 12) : [],
      schedule: hydrateMediaSchedule(
        row.schedule,
        normalizeMediaState(rawDraft, defaults),
        normalizeMediaState(rawPublished, defaults)
      ),
      updatedAt: row.updated_at || null,
      publishedAt: row.published_at || null,
      persistent: true,
      storeMode: 'supabase-rls'
    };
  } catch (error) {
    console.error('Rebecca media read fallback:', error?.message || error);
    return {
      draft: defaults,
      published: defaults,
      version: 0,
      publishedVersion: 0,
      history: [],
      schedule: null,
      updatedAt: null,
      publishedAt: null,
      persistent: false,
      storeMode: 'canonical-fallback-error'
    };
  }
}

async function patchMediaState(currentVersion, patch) {
  const rows = await supabaseFetch(
    '/rest/v1/rebecca_media_api?id=eq.' + STORE_ID + '&version=eq.' + encodeURIComponent(String(currentVersion)),
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    }
  );

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) {
    const error = new Error('Media changed in another session. Reload before saving again.');
    error.code = 'MEDIA_CONFLICT';
    throw error;
  }
  return row;
}

export async function saveMediaDraft(input, updatedBy = 'Rebecca') {
  const current = await readMediaState();
  if (!current.persistent) {
    const error = new Error('Media storage is not available.');
    error.code = 'MEDIA_UNAVAILABLE';
    throw error;
  }

  const draft = normalizeMediaState(input, current.draft);
  const now = new Date().toISOString();
  const row = await patchMediaState(current.version, {
    version: current.version + 1,
    draft,
    updated_by: cleanText(updatedBy, 120) || 'Rebecca',
    updated_at: now
  });

  return {
    ...current,
    draft,
    version: Number(row.version) || current.version + 1,
    updatedAt: row.updated_at || now
  };
}

export async function publishMediaDraft(updatedBy = 'Rebecca') {
  const current = await readMediaState();
  if (!current.persistent) {
    const error = new Error('Media storage is not available.');
    error.code = 'MEDIA_UNAVAILABLE';
    throw error;
  }

  const schedulePhase = mediaSchedulePhase(current.schedule);
  if (schedulePhase === 'pending' || schedulePhase === 'active') {
    const error = new Error('Cancel the scheduled publish before publishing a different media draft manually.');
    error.code = 'MEDIA_SCHEDULE_ACTIVE';
    throw error;
  }

  const now = new Date().toISOString();
  const history = Array.isArray(current.history) ? [...current.history] : [];
  if (current.publishedVersion > 0) {
    history.unshift({
      version: current.publishedVersion,
      publishedAt: current.publishedAt,
      state: current.published
    });
  }

  const nextPublishedVersion = current.publishedVersion + 1;
  const row = await patchMediaState(current.version, {
    version: current.version + 1,
    published: current.draft,
    published_version: nextPublishedVersion,
    history: history.slice(0, 12),
    schedule: {},
    updated_by: cleanText(updatedBy, 120) || 'Rebecca',
    updated_at: now,
    published_at: now
  });

  return {
    ...current,
    published: current.draft,
    schedule: null,
    publishedVersion: Number(row.published_version) || nextPublishedVersion,
    history: Array.isArray(row.history) ? row.history : history.slice(0, 12),
    version: Number(row.version) || current.version + 1,
    updatedAt: row.updated_at || now,
    publishedAt: row.published_at || now
  };
}

export async function scheduleMediaDraft(
  { publishLocal, expireLocal = null } = {},
  updatedBy = 'Rebecca',
  now = new Date()
) {
  const current = await readMediaState();
  if (!current.persistent) {
    const error = new Error('Media storage is not available.');
    error.code = 'MEDIA_UNAVAILABLE';
    throw error;
  }

  if (current.schedule) {
    const error = new Error('A media schedule already exists. Cancel or clear it before creating another one.');
    error.code = 'MEDIA_SCHEDULE_ACTIVE';
    throw error;
  }

  if (!mediaHasDraftChanges(current)) {
    const error = new Error('Save a media draft that differs from the live version before scheduling it.');
    error.code = 'MEDIA_SCHEDULE_NO_CHANGES';
    throw error;
  }

  const schedule = buildMediaSchedule({
    draft: current.draft,
    published: current.published,
    publishedVersion: current.publishedVersion,
    publishLocal,
    expireLocal,
    now,
    createdBy: updatedBy
  });

  const changedAt = new Date(now).toISOString();
  const row = await patchMediaState(current.version, {
    version: current.version + 1,
    schedule,
    updated_by: cleanText(updatedBy, 120) || 'Rebecca',
    updated_at: changedAt
  });

  return {
    ...current,
    schedule,
    version: Number(row.version) || current.version + 1,
    updatedAt: row.updated_at || changedAt
  };
}

export async function commitActiveMediaSchedule(updatedBy = 'Rebecca', now = new Date()) {
  const current = await readMediaState();
  if (!current.persistent) {
    const error = new Error('Media storage is not available.');
    error.code = 'MEDIA_UNAVAILABLE';
    throw error;
  }

  const phase = mediaSchedulePhase(current.schedule, now);
  if (phase !== 'active' || !current.schedule?.state) {
    const error = new Error('Only a currently live scheduled version can be kept permanently.');
    error.code = 'MEDIA_SCHEDULE_NOT_ACTIVE';
    throw error;
  }

  const history = Array.isArray(current.history) ? [...current.history] : [];
  if (current.publishedVersion > 0) {
    history.unshift({
      version: current.publishedVersion,
      publishedAt: current.publishedAt,
      state: current.published
    });
  }

  const nextPublishedVersion = current.publishedVersion + 1;
  const changedAt = new Date(now).toISOString();
  const scheduledState = normalizeMediaState(current.schedule.state, current.draft);
  const row = await patchMediaState(current.version, {
    version: current.version + 1,
    published: scheduledState,
    published_version: nextPublishedVersion,
    history: history.slice(0, 12),
    schedule: {},
    updated_by: cleanText(updatedBy, 120) || 'Rebecca',
    updated_at: changedAt,
    published_at: changedAt
  });

  return {
    ...current,
    published: scheduledState,
    schedule: null,
    publishedVersion: Number(row.published_version) || nextPublishedVersion,
    history: Array.isArray(row.history) ? row.history : history.slice(0, 12),
    version: Number(row.version) || current.version + 1,
    updatedAt: row.updated_at || changedAt,
    publishedAt: row.published_at || changedAt
  };
}

export async function cancelMediaSchedule(updatedBy = 'Rebecca', now = new Date()) {
  const current = await readMediaState();
  if (!current.persistent) {
    const error = new Error('Media storage is not available.');
    error.code = 'MEDIA_UNAVAILABLE';
    throw error;
  }

  if (!current.schedule) return current;

  const changedAt = new Date(now).toISOString();
  const row = await patchMediaState(current.version, {
    version: current.version + 1,
    schedule: {},
    updated_by: cleanText(updatedBy, 120) || 'Rebecca',
    updated_at: changedAt
  });

  return {
    ...current,
    schedule: null,
    version: Number(row.version) || current.version + 1,
    updatedAt: row.updated_at || changedAt
  };
}

export function getEffectiveMediaState(state, now = new Date()) {
  return evaluateMediaSchedule(state, now);
}

export async function restoreMediaVersion(version, updatedBy = 'Rebecca') {
  const current = await readMediaState();
  const targetVersion = Number(version);
  const item = current.history.find((entry) => Number(entry?.version) === targetVersion);
  if (!item?.state) {
    const error = new Error('That published version is no longer available.');
    error.code = 'MEDIA_VERSION_NOT_FOUND';
    throw error;
  }

  return saveMediaDraft(item.state, updatedBy);
}

export function mediaHasDraftChanges(state) {
  return JSON.stringify(state?.draft || {}) !== JSON.stringify(state?.published || {});
}
