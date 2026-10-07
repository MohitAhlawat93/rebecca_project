import { createHash } from 'node:crypto';

const STORE_ID = 'current';
const MAX_ITEMS = 100;
const clone = (value) => JSON.parse(JSON.stringify(value));

function cleanText(value, max = 300) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanPage(value) {
  const text = cleanText(value, 140);
  if (!text.startsWith('/') || text.startsWith('//')) return '/';
  return text;
}

function hasSensitiveContent(value = '') {
  const text = String(value || '');
  const lower = text.toLowerCase();

  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) return true;
  if (/https?:\/\/|www\./i.test(text)) return true;
  if (/(?:\+?\d[\d\s().-]{6,}\d)/.test(text)) return true;
  if (/\b\d{7,}\b/.test(text)) return true;

  return /passport|driver'?s?\s+licen[cs]e|national\s+id|identity\s+card|id\s+number|screening\s+(?:document|file|photo)|employer\s+(?:document|letter|details)|bank\s+(?:account|statement|details)|credit\s+card|debit\s+card|account\s+number|routing\s+number|swift\s+code|ssn|social\s+security|tax\s+id|home\s+address|hotel\s+address|exact(?:\s+\w+){0,3}\s+address|private\s+(?:address|location|number)|current\s+(?:hotel|location|address)|real\s+name/.test(lower);
}

function sanitizeQuestion(value = '') {
  return cleanText(
    String(value || '')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email removed]')
      .replace(/https?:\/\/\S+|www\.\S+/gi, '[link removed]')
      .replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, '[number removed]'),
    260
  );
}

const KEY_STOP_WORDS = new Set([
  'about','again','also','and','are','ask','can','could','does','for','from','have','her','how','i','is','it','me','my',
  'of','on','or','please','rebecca','she','tell','that','the','this','to','what','when','where','which','who','why','with',
  'would','you','your'
]);

function questionFingerprint(value = '') {
  const normalized = String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !KEY_STOP_WORDS.has(token));

  const stable = [...new Set(normalized)].sort().join(' ') || String(value || '').toLowerCase().trim();
  return createHash('sha256').update(stable).digest('hex').slice(0, 20);
}

function normalizeStatus(value) {
  return ['open', 'drafted', 'resolved', 'ignored'].includes(value) ? value : 'open';
}

function normalizeItem(item = {}) {
  return {
    id: cleanText(item.id, 80),
    question: cleanText(item.question, 260),
    page: cleanPage(item.page),
    count: Math.max(1, Math.min(100000, Number(item.count) || 1)),
    firstSeen: cleanText(item.firstSeen, 80) || new Date(0).toISOString(),
    lastSeen: cleanText(item.lastSeen, 80) || new Date(0).toISOString(),
    status: normalizeStatus(item.status),
    sourceMode: cleanText(item.sourceMode, 60) || 'unknown'
  };
}

function normalizeItems(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_ITEMS)
    .map(normalizeItem)
    .filter((item) => item.id && item.question);
}

export function needsRebeccaStoreConfigured() {
  return Boolean(
    String(process.env.RC_SUPABASE_URL || '').trim() &&
    String(process.env.RC_SUPABASE_PUBLISHABLE_KEY || '').trim() &&
    String(process.env.RC_STORE_SECRET || '').trim()
  );
}

function headers(extra = {}) {
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
    headers: headers(options.headers || {}),
    cache: 'no-store'
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(
      'Needs Rebecca storage request failed (' + response.status + ')' +
      (details ? ': ' + details.slice(0, 220) : '')
    );
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function readNeedsRebeccaState() {
  if (!needsRebeccaStoreConfigured()) {
    return {
      items: [],
      version: 0,
      updatedAt: null,
      persistent: false,
      storeMode: 'not-configured'
    };
  }

  try {
    const rows = await supabaseFetch(
      '/rest/v1/rebecca_needs_api?id=eq.' + STORE_ID + '&select=id,version,items,updated_at&limit=1',
      { method: 'GET' }
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) throw new Error('Needs Rebecca storage row is not visible.');

    return {
      items: normalizeItems(row.items),
      version: Number(row.version) || 0,
      updatedAt: row.updated_at || null,
      persistent: true,
      storeMode: 'supabase-rls'
    };
  } catch (error) {
    console.error('Needs Rebecca read fallback:', error?.message || error);
    return {
      items: [],
      version: 0,
      updatedAt: null,
      persistent: false,
      storeMode: 'store-error'
    };
  }
}

async function patchItems(currentVersion, items, updatedBy = 'Rebecca Concierge') {
  const nextVersion = Math.max(0, Number(currentVersion) || 0) + 1;
  const now = new Date().toISOString();

  const rows = await supabaseFetch(
    '/rest/v1/rebecca_needs_api?id=eq.' + STORE_ID +
    '&version=eq.' + encodeURIComponent(String(currentVersion)),
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        version: nextVersion,
        items: normalizeItems(items),
        updated_by: cleanText(updatedBy, 120) || 'Rebecca Concierge',
        updated_at: now
      })
    }
  );

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) {
    const error = new Error('Needs Rebecca changed in another request.');
    error.code = 'STORE_CONFLICT';
    throw error;
  }

  return {
    items: normalizeItems(row.items),
    version: Number(row.version) || nextVersion,
    updatedAt: row.updated_at || now,
    persistent: true,
    storeMode: 'supabase-rls'
  };
}

export function shouldCaptureNeedsRebeccaQuestion(message = '') {
  const text = cleanText(message, 700);
  if (text.length < 4) return false;
  if (hasSensitiveContent(text)) return false;
  return true;
}

export async function recordNeedsRebeccaQuestion({
  message = '',
  page = '/',
  sourceMode = 'unknown'
} = {}) {
  if (!needsRebeccaStoreConfigured()) return { recorded: false, reason: 'not-configured' };
  if (!shouldCaptureNeedsRebeccaQuestion(message)) return { recorded: false, reason: 'privacy-filter' };

  const question = sanitizeQuestion(message);
  const id = questionFingerprint(question);
  if (!question || !id) return { recorded: false, reason: 'empty' };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readNeedsRebeccaState();
    if (!current.persistent) return { recorded: false, reason: 'store-unavailable' };

    const now = new Date().toISOString();
    const items = clone(current.items);
    const index = items.findIndex((item) => item.id === id);

    if (index >= 0) {
      items[index] = {
        ...items[index],
        count: Math.min(100000, Number(items[index].count || 0) + 1),
        lastSeen: now,
        page: cleanPage(page),
        sourceMode: cleanText(sourceMode, 60) || items[index].sourceMode,
        status: items[index].status === 'ignored' || items[index].status === 'resolved'
          ? 'open'
          : items[index].status
      };
    } else {
      items.unshift({
        id,
        question,
        page: cleanPage(page),
        count: 1,
        firstSeen: now,
        lastSeen: now,
        status: 'open',
        sourceMode: cleanText(sourceMode, 60) || 'unknown'
      });
    }

    items.sort((a, b) => {
      const statusRank = (item) => item.status === 'open' ? 0 : item.status === 'drafted' ? 1 : 2;
      const rank = statusRank(a) - statusRank(b);
      if (rank) return rank;
      if (b.count !== a.count) return b.count - a.count;
      return String(b.lastSeen).localeCompare(String(a.lastSeen));
    });

    try {
      const saved = await patchItems(current.version, items.slice(0, MAX_ITEMS), 'Rebecca Concierge');
      return { recorded: true, item: saved.items.find((item) => item.id === id) || null };
    } catch (error) {
      if (error?.code !== 'STORE_CONFLICT' || attempt === 2) throw error;
    }
  }

  return { recorded: false, reason: 'conflict' };
}

export async function setNeedsRebeccaStatus(id, status, updatedBy = 'Rebecca') {
  const cleanId = cleanText(id, 80);
  const nextStatus = normalizeStatus(status);
  const current = await readNeedsRebeccaState();

  if (!current.persistent) {
    const error = new Error('Needs Rebecca storage is unavailable.');
    error.code = 'STORE_UNAVAILABLE';
    throw error;
  }

  const items = clone(current.items);
  const index = items.findIndex((item) => item.id === cleanId);
  if (index < 0) {
    const error = new Error('That Needs Rebecca item no longer exists.');
    error.code = 'NEEDS_ITEM_NOT_FOUND';
    throw error;
  }

  items[index].status = nextStatus;
  return patchItems(current.version, items, updatedBy);
}

export async function deleteNeedsRebeccaItem(id, updatedBy = 'Rebecca') {
  const cleanId = cleanText(id, 80);
  const current = await readNeedsRebeccaState();

  if (!current.persistent) {
    const error = new Error('Needs Rebecca storage is unavailable.');
    error.code = 'STORE_UNAVAILABLE';
    throw error;
  }

  const items = current.items.filter((item) => item.id !== cleanId);
  if (items.length === current.items.length) {
    const error = new Error('That Needs Rebecca item no longer exists.');
    error.code = 'NEEDS_ITEM_NOT_FOUND';
    throw error;
  }

  return patchItems(current.version, items, updatedBy);
}

export async function clearClosedNeedsRebecca(updatedBy = 'Rebecca') {
  const current = await readNeedsRebeccaState();

  if (!current.persistent) {
    const error = new Error('Needs Rebecca storage is unavailable.');
    error.code = 'STORE_UNAVAILABLE';
    throw error;
  }

  const items = current.items.filter((item) => !['resolved', 'ignored'].includes(item.status));
  return patchItems(current.version, items, updatedBy);
}
