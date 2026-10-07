import { getAdminSession } from '../../lib/admin-auth.js';
import { buildLiveSearchIntelligence } from '../../lib/search-measurement-service.mjs';

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

  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Use GET or POST.' });
  }

  try {
    const body = req.method === 'POST' ? bodyOf(req) : {};
    const includeLive =
      req.method === 'GET'
        ? String(req.query?.live || '') === '1'
        : body.includeLive !== false;

    const report = await buildLiveSearchIntelligence({
      includeLive,
      imports: body.imports || {}
    });

    return res.status(200).json({ ok: true, ...report });
  } catch (error) {
    console.error('SEARCH-07 intelligence API failed:', error);
    return res.status(500).json({
      error: 'Could not build search intelligence safely.'
    });
  }
}
