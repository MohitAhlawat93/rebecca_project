import { getAdminSession } from '../../lib/admin-auth.js';
import { persistSearchExport } from '../../lib/search-sync-service.mjs';

const ALLOWED = new Set([
  'google-generative-ai',
  'google-multimodal',
  'bing-ai-performance'
]);

export default async function handler(req, res) {
  noCache(res);
  if (!getAdminSession(req)) return res.status(401).json({ error: 'Owner session required.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const kind = String(req.body?.kind || '');
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!ALLOWED.has(kind)) {
    return res.status(400).json({ error: 'Unsupported search export kind.' });
  }
  if (!rows.length || rows.length > 50000) {
    return res.status(400).json({ error: 'Provide between 1 and 50,000 export rows.' });
  }

  try {
    const result = await persistSearchExport(kind, rows);
    return res.status(200).json({ ok: true, kind, ...result });
  } catch (error) {
    console.error('SEARCH-08 search export import failed:', error);
    return res.status(500).json({
      error: 'Could not persist that search export safely.',
      code: error?.code || 'SEARCH_IMPORT_FAILED'
    });
  }
}

function noCache(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}
