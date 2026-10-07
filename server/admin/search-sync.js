import { getAdminSession } from '../../lib/admin-auth.js';
import {
  syncAllSearchProviders,
  syncSearchProvider
} from '../../lib/search-sync-service.mjs';

export default async function handler(req, res) {
  noCache(res);
  if (!getAdminSession(req)) return res.status(401).json({ error: 'Owner session required.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const provider = String(req.body?.provider || '').toLowerCase();

  try {
    const result = ['google', 'bing'].includes(provider)
      ? await syncSearchProvider(provider, { trigger: 'manual' })
      : await syncAllSearchProviders({ trigger: 'manual' });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error('SEARCH-08 manual sync failed:', error);
    return res.status(500).json({
      error: 'Could not sync search data safely.',
      code: error?.code || 'SEARCH_SYNC_FAILED'
    });
  }
}

function noCache(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}
