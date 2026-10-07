import { getAdminSession } from '../../lib/admin-auth.js';
import { buildLiveSearchIntelligence } from '../../lib/search-measurement-service.mjs';
import { searchStoreConfigured } from '../../lib/search-persistence-store.mjs';
import { buildPersistedSearchIntelligence } from '../../lib/search-sync-service.mjs';

function noCache(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}

function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

export default async function handler(req, res) {
  noCache(res);
  if (!getAdminSession(req)) return res.status(401).json({ error: 'Owner session required.' });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Use GET.' });
  }

  try {
    const mode = String(req.query?.mode || 'persisted');
    if (mode === 'live') {
      const report = await buildLiveSearchIntelligence({ includeLive: true });
      return res.status(200).json({ ok: true, mode: 'live-transient', ...report });
    }
    if (searchStoreConfigured()) {
      const report = await buildPersistedSearchIntelligence();
      return res.status(200).json({ ok: true, mode: 'persisted', ...report });
    }
    const fallback = await buildLiveSearchIntelligence({ includeLive: false });
    return res.status(200).json({
      ok: true,
      mode: 'connection-state-only',
      ...fallback,
      persistence: { mode: 'not-configured' }
    });
  } catch (error) {
    console.error('SEARCH-08 intelligence API failed:', error);
    return res.status(500).json({
      error: 'Could not build search intelligence safely.',
      code: error?.code || 'SEARCH_INTELLIGENCE_FAILED'
    });
  }
}
