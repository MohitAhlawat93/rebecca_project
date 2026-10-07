import { syncAllSearchProviders } from '../../lib/search-sync-service.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });

  const expected = String(process.env.CRON_SECRET || '');
  const supplied = String(req.headers?.authorization || '');
  if (!expected || supplied !== 'Bearer ' + expected) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const result = await syncAllSearchProviders({ trigger: 'cron' });
    return res.status(result.success ? 200 : 207).json({
      ok: result.success,
      ...result
    });
  } catch (error) {
    console.error('SEARCH-08 scheduled sync failed:', error);
    return res.status(500).json({
      error: 'Scheduled search sync failed.',
      code: error?.code || 'SEARCH_CRON_FAILED'
    });
  }
}
