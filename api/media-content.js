import { getAdminSession } from '../lib/admin-auth.js';
import { getEffectiveMediaState, mediaHasDraftChanges, readMediaState } from '../lib/media-store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });

  const preview = String(req.query?.preview || '') === '1';
  const scheduledPreview = String(req.query?.scheduled || '') === '1';
  if ((preview || scheduledPreview) && !getAdminSession(req)) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return res.status(401).json({ error: 'Owner session required for private media preview.' });
  }

  const state = await readMediaState();
  const effective = getEffectiveMediaState(state);
  res.setHeader(
    'Cache-Control',
    (preview || scheduledPreview) ? 'private, no-store, max-age=0' : 'public, max-age=0, s-maxage=30, stale-while-revalidate=120'
  );

  return res.status(200).json({
    state: scheduledPreview
      ? (state.schedule?.state || state.draft)
      : (preview ? state.draft : effective.state),
    version: scheduledPreview
      ? ('scheduled:' + (state.schedule?.id || 'none'))
      : (preview ? state.version : effective.effectiveVersion),
    publishedAt: scheduledPreview
      ? state.schedule?.publishAt || null
      : (preview ? state.publishedAt : effective.effectivePublishedAt),
    schedulePhase: (preview || scheduledPreview) ? undefined : effective.phase,
    preview: preview || scheduledPreview,
    previewMode: scheduledPreview ? 'scheduled' : (preview ? 'draft' : null),
    hasDraftChanges: (preview || scheduledPreview) ? mediaHasDraftChanges(state) : undefined
  });
}
