import { getAdminSession } from '../lib/admin-auth.js';
import { mediaHasDraftChanges, readMediaState } from '../lib/media-store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });

  const preview = String(req.query?.preview || '') === '1';
  if (preview && !getAdminSession(req)) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return res.status(401).json({ error: 'Owner session required for draft preview.' });
  }

  const state = await readMediaState();
  res.setHeader(
    'Cache-Control',
    preview ? 'private, no-store, max-age=0' : 'public, max-age=0, s-maxage=30, stale-while-revalidate=120'
  );

  return res.status(200).json({
    state: preview ? state.draft : state.published,
    version: preview ? state.version : state.publishedVersion,
    publishedAt: state.publishedAt,
    preview,
    hasDraftChanges: preview ? mediaHasDraftChanges(state) : undefined
  });
}
