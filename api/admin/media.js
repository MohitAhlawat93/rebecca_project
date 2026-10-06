import { getAdminSession } from '../../lib/admin-auth.js';
import {
  MEDIA_PLACEMENTS,
  mediaHasDraftChanges,
  mediaStoreConfigured,
  publishMediaDraft,
  readMediaState,
  restoreMediaVersion,
  saveMediaDraft
} from '../../lib/media-store.js';

function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
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
  const session = getAdminSession(req);
  if (!session) return res.status(401).json({ error: 'Owner session required.' });

  try {
    if (req.method === 'GET') {
      const state = await readMediaState();
      return res.status(200).json({
        ok: true,
        configured: mediaStoreConfigured(),
        placements: MEDIA_PLACEMENTS,
        hasDraftChanges: mediaHasDraftChanges(state),
        ...state
      });
    }

    if (req.method === 'PUT') {
      const body = bodyOf(req);
      const state = await saveMediaDraft(body.state, 'Rebecca');
      return res.status(200).json({
        ok: true,
        placements: MEDIA_PLACEMENTS,
        hasDraftChanges: mediaHasDraftChanges(state),
        ...state
      });
    }

    if (req.method === 'POST') {
      const body = bodyOf(req);
      let state;
      if (body.action === 'publish') state = await publishMediaDraft('Rebecca');
      else if (body.action === 'restore') state = await restoreMediaVersion(body.version, 'Rebecca');
      else return res.status(400).json({ error: 'Unknown media action.' });

      return res.status(200).json({
        ok: true,
        placements: MEDIA_PLACEMENTS,
        hasDraftChanges: mediaHasDraftChanges(state),
        ...state
      });
    }

    return res.status(405).json({ error: 'Use GET, PUT or POST.' });
  } catch (error) {
    if (error?.code === 'MEDIA_CONFLICT') {
      return res.status(409).json({ error: error.message });
    }
    if (error?.code === 'MEDIA_UNAVAILABLE') {
      return res.status(503).json({ error: 'Media storage is not available right now.' });
    }
    if (error?.code === 'MEDIA_VERSION_NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    console.error('RC-03 media API failed:', error);
    return res.status(500).json({ error: 'Could not update media safely.' });
  }
}
