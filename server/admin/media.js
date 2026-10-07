import { getAdminSession } from '../../lib/admin-auth.js';
import {
  MEDIA_PLACEMENTS,
  cancelMediaSchedule,
  commitActiveMediaSchedule,
  getEffectiveMediaState,
  mediaHasDraftChanges,
  mediaStoreConfigured,
  publishMediaDraft,
  readMediaState,
  restoreMediaVersion,
  saveMediaDraft,
  scheduleMediaDraft
} from '../../lib/media-store.js';
import { recordSystemEvent, safeCaptureRecoverySnapshot } from '../../lib/system-store.js';

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
      const effective = getEffectiveMediaState(state);
      return res.status(200).json({
        ok: true,
        configured: mediaStoreConfigured(),
        placements: MEDIA_PLACEMENTS,
        hasDraftChanges: mediaHasDraftChanges(state),
        schedulePhase: effective.phase,
        effectivePublishedAt: effective.effectivePublishedAt,
        effectiveVersion: effective.effectiveVersion,
        ...state
      });
    }

    if (req.method === 'PUT') {
      const body = bodyOf(req);
      const state = await saveMediaDraft(body.state, 'Rebecca');
      const effective = getEffectiveMediaState(state);
      return res.status(200).json({
        ok: true,
        placements: MEDIA_PLACEMENTS,
        hasDraftChanges: mediaHasDraftChanges(state),
        schedulePhase: effective.phase,
        effectivePublishedAt: effective.effectivePublishedAt,
        effectiveVersion: effective.effectiveVersion,
        ...state
      });
    }

    if (req.method === 'POST') {
      const body = bodyOf(req);
      let state;
      if (body.action === 'publish') {
        await safeCaptureRecoverySnapshot('Before Media publish','Media & Publish');
        state = await publishMediaDraft('Rebecca');
        try{await recordSystemEvent({area:'Media',type:'publish',summary:'Media Draft was published to the website.',source:'Media & Publish'});}catch{}
      }
      else if (body.action === 'restore') state = await restoreMediaVersion(body.version, 'Rebecca');
      else if (body.action === 'schedule') {
        state = await scheduleMediaDraft({
          publishLocal: body.publishLocal,
          expireLocal: body.expireLocal || null
        }, 'Rebecca');
        try{await recordSystemEvent({area:'Media',type:'schedule',summary:'A saved Media Draft was scheduled for automatic publishing.',source:'Media & Publish'});}catch{}
      } else if (body.action === 'cancel_schedule') {
        state = await cancelMediaSchedule('Rebecca');
      } else if (body.action === 'commit_schedule') {
        await safeCaptureRecoverySnapshot('Before keeping scheduled media live permanently','Media & Publish');
        state = await commitActiveMediaSchedule('Rebecca');
        try{await recordSystemEvent({area:'Media',type:'publish',summary:'Active scheduled media was kept live permanently.',source:'Media & Publish'});}catch{}
      } else return res.status(400).json({ error: 'Unknown media action.' });

      const effective = getEffectiveMediaState(state);
      return res.status(200).json({
        ok: true,
        placements: MEDIA_PLACEMENTS,
        hasDraftChanges: mediaHasDraftChanges(state),
        schedulePhase: effective.phase,
        effectivePublishedAt: effective.effectivePublishedAt,
        effectiveVersion: effective.effectiveVersion,
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
    if (
      error?.code === 'MEDIA_SCHEDULE_ACTIVE' ||
      error?.code === 'MEDIA_SCHEDULE_INVALID' ||
      error?.code === 'MEDIA_SCHEDULE_NO_CHANGES' ||
      error?.code === 'MEDIA_SCHEDULE_NOT_ACTIVE'
    ) {
      return res.status(409).json({ error: error.message });
    }
    console.error('RC-04B media API failed:', error);
    return res.status(500).json({ error: 'Could not update media safely.' });
  }
}
