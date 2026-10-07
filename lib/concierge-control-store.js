const STORE_ID = 'current';

const clone = (value) => JSON.parse(JSON.stringify(value));

function cleanText(value, max = 400) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanPath(value) {
  const text = cleanText(value, 160);
  if (!text) return '';
  if (!text.startsWith('/') || text.startsWith('//')) return '';
  return text;
}

function slug(value = '') {
  return cleanText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'answer';
}

function cleanKeywords(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  return [...new Set(items
    .slice(0, 20)
    .map((item) => cleanText(item, 80).toLowerCase())
    .filter(Boolean))];
}

export function buildDefaultConciergeControl() {
  return {
    enabled: true,
    displayName: 'Rebecca’s Desk',
    subtitle: 'Plans, rates & practicalities.',
    welcome: 'Hi ✦ I’m Rebecca’s Desk assistant.',
    defaultIntro: 'Ask me about Rebecca’s public rates, travel, etiquette or how to enquire.',
    pausedMessage: 'Rebecca’s Desk is taking a short pause. Please use the Contact page for anything time-sensitive.',
    trustedAnswers: []
  };
}

export function normalizeConciergeControl(input = {}, fallback = buildDefaultConciergeControl()) {
  const answers = Array.isArray(input.trustedAnswers)
    ? input.trustedAnswers.slice(0, 60)
    : fallback.trustedAnswers;

  return {
    enabled: input.enabled !== false,
    displayName: cleanText(input.displayName, 80) || fallback.displayName,
    subtitle: cleanText(input.subtitle, 120) || fallback.subtitle,
    welcome: cleanText(input.welcome, 220) || fallback.welcome,
    defaultIntro: cleanText(input.defaultIntro, 300) || fallback.defaultIntro,
    pausedMessage: cleanText(input.pausedMessage, 300) || fallback.pausedMessage,
    trustedAnswers: answers.map((item, index) => {
      const question = cleanText(item?.question, 220);
      const answer = cleanText(item?.answer, 1200);
      const baseId = item?.id || question || String(index + 1);
      return {
        id: cleanText(item?.id || slug(baseId), 100),
        question,
        answer,
        keywords: cleanKeywords(item?.keywords),
        linkPath: cleanPath(item?.linkPath),
        linkLabel: cleanText(item?.linkLabel, 80),
        enabled: item?.enabled !== false
      };
    }).filter((item) => item.id && item.question && item.answer)
  };
}

export function conciergeControlConfigured() {
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
  const root = String(process.env.RC_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const response = await fetch(root + path, {
    ...options,
    headers: supabaseHeaders(options.headers || {}),
    cache: 'no-store'
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(
      'Rebecca Concierge storage request failed (' + response.status + ')' +
      (details ? ': ' + details.slice(0, 240) : '')
    );
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 20).map((item) => ({
    version: Math.max(0, Number(item?.version) || 0),
    publishedAt: cleanText(item?.publishedAt, 80) || null,
    state: normalizeConciergeControl(item?.state || {})
  }));
}

export function conciergeHasDraftChanges(state) {
  return JSON.stringify(state?.draft || {}) !== JSON.stringify(state?.published || {});
}

export async function readConciergeControlState() {
  const defaults = buildDefaultConciergeControl();

  if (!conciergeControlConfigured()) {
    return {
      draft: defaults,
      published: defaults,
      version: 0,
      publishedVersion: 0,
      history: [],
      updatedAt: null,
      publishedAt: null,
      persistent: false,
      storeMode: 'canonical-fallback',
      hasDraftChanges: false
    };
  }

  try {
    const rows = await supabaseFetch(
      '/rest/v1/rebecca_concierge_api?id=eq.' + STORE_ID +
      '&select=id,version,draft,published,published_version,history,updated_at,published_at&limit=1',
      { method: 'GET' }
    );

    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) throw new Error('Rebecca Concierge storage row is not visible.');

    const published = row.published && Object.keys(row.published).length
      ? normalizeConciergeControl(row.published, defaults)
      : defaults;

    const draft = row.draft && Object.keys(row.draft).length
      ? normalizeConciergeControl(row.draft, published)
      : clone(published);

    const result = {
      draft,
      published,
      version: Number(row.version) || 0,
      publishedVersion: Number(row.published_version) || 0,
      history: normalizeHistory(row.history),
      updatedAt: row.updated_at || null,
      publishedAt: row.published_at || null,
      persistent: true,
      storeMode: 'supabase-rls'
    };

    return {
      ...result,
      hasDraftChanges: conciergeHasDraftChanges(result)
    };
  } catch (error) {
    console.error('Rebecca Concierge read fallback:', error?.message || error);
    return {
      draft: defaults,
      published: defaults,
      version: 0,
      publishedVersion: 0,
      history: [],
      updatedAt: null,
      publishedAt: null,
      persistent: false,
      storeMode: 'canonical-fallback-error',
      hasDraftChanges: false
    };
  }
}

async function patchConciergeRow(currentVersion, patch, updatedBy = 'Rebecca') {
  const nextVersion = Math.max(0, Number(currentVersion) || 0) + 1;
  const now = new Date().toISOString();

  const rows = await supabaseFetch(
    '/rest/v1/rebecca_concierge_api?id=eq.' + STORE_ID +
    '&version=eq.' + encodeURIComponent(String(currentVersion)),
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        version: nextVersion,
        ...patch,
        updated_by: cleanText(updatedBy, 120) || 'Rebecca',
        updated_at: now
      })
    }
  );

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) {
    const error = new Error('Concierge Control changed in another session. Reload before continuing.');
    error.code = 'STORE_CONFLICT';
    throw error;
  }

  return { row, nextVersion, now };
}

function requirePersistent(current) {
  if (!conciergeControlConfigured()) {
    const error = new Error('Persistent concierge storage is not configured yet.');
    error.code = 'STORE_NOT_CONFIGURED';
    throw error;
  }
  if (!current?.persistent) {
    const error = new Error('Persistent concierge storage is temporarily unavailable.');
    error.code = 'STORE_UNAVAILABLE';
    throw error;
  }
}

export async function saveConciergeDraft(input, updatedBy = 'Rebecca') {
  const current = await readConciergeControlState();
  requirePersistent(current);

  const draft = normalizeConciergeControl(input, current.published);
  const { row, nextVersion, now } = await patchConciergeRow(
    current.version,
    { draft },
    updatedBy
  );

  const next = {
    ...current,
    draft,
    version: Number(row.version) || nextVersion,
    updatedAt: row.updated_at || now
  };

  return {
    ...next,
    hasDraftChanges: conciergeHasDraftChanges(next)
  };
}

export async function publishConciergeDraft(updatedBy = 'Rebecca') {
  const current = await readConciergeControlState();
  requirePersistent(current);

  if (!current.hasDraftChanges) {
    const error = new Error('There is no saved Concierge Draft to publish.');
    error.code = 'CONCIERGE_DRAFT_EMPTY';
    throw error;
  }

  const published = normalizeConciergeControl(current.draft, current.published);
  const now = new Date().toISOString();
  const nextPublishedVersion = current.publishedVersion + 1;
  const history = [
    {
      version: current.publishedVersion,
      publishedAt: current.publishedAt,
      state: current.published
    },
    ...current.history
  ].slice(0, 20);

  const { row, nextVersion } = await patchConciergeRow(
    current.version,
    {
      draft: published,
      published,
      published_version: nextPublishedVersion,
      history,
      published_at: now
    },
    updatedBy
  );

  return {
    draft: clone(published),
    published,
    version: Number(row.version) || nextVersion,
    publishedVersion: Number(row.published_version) || nextPublishedVersion,
    history,
    updatedAt: row.updated_at || now,
    publishedAt: row.published_at || now,
    persistent: true,
    storeMode: 'supabase-rls',
    hasDraftChanges: false
  };
}

export async function discardConciergeDraft(updatedBy = 'Rebecca') {
  const current = await readConciergeControlState();
  requirePersistent(current);

  if (!current.hasDraftChanges) return current;

  const draft = clone(current.published);
  const { row, nextVersion, now } = await patchConciergeRow(
    current.version,
    { draft },
    updatedBy
  );

  return {
    ...current,
    draft,
    version: Number(row.version) || nextVersion,
    updatedAt: row.updated_at || now,
    hasDraftChanges: false
  };
}

export async function restoreConciergeHistoryVersion(version, updatedBy = 'Rebecca') {
  const current = await readConciergeControlState();
  requirePersistent(current);

  const target = current.history.find((item) => Number(item.version) === Number(version));
  if (!target) {
    const error = new Error('That Concierge history version is no longer available.');
    error.code = 'CONCIERGE_HISTORY_NOT_FOUND';
    throw error;
  }

  return saveConciergeDraft(target.state, updatedBy);
}

export async function getPublishedConciergeControl() {
  const current = await readConciergeControlState();
  return current.published;
}

export function publicConciergeUiConfig(control) {
  const safe = normalizeConciergeControl(control || {});
  return {
    enabled: safe.enabled,
    displayName: safe.displayName,
    subtitle: safe.subtitle,
    welcome: safe.welcome,
    defaultIntro: safe.defaultIntro,
    pausedMessage: safe.pausedMessage
  };
}
