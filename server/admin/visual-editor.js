import { getAdminSession } from '../../lib/admin-auth.js';
import {
  applyQuickControlState,
  discardVisualEditorDraft,
  publishVisualEditorDraft,
  readVisualEditorState,
  saveVisualEditorDraft
} from '../../lib/admin-store.js';
import { REBECCA_DATA } from '../../data/rebecca-data.js';
import { recordSystemEvent, safeCaptureRecoverySnapshot } from '../../lib/system-store.js';

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

function responseShape(state) {
  return {
    ok: true,
    ...state,
    previewData: applyQuickControlState(REBECCA_DATA, state.draft),
    publishedData: applyQuickControlState(REBECCA_DATA, state.published)
  };
}

export default async function handler(req, res) {
  noCache(res);

  if (!getAdminSession(req)) {
    return res.status(401).json({ error: 'Owner session required.' });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json(responseShape(await readVisualEditorState()));
    }

    if (req.method === 'PUT') {
      const body = bodyOf(req);
      return res.status(200).json(
        responseShape(await saveVisualEditorDraft(body.state, 'Rebecca Visual Editor'))
      );
    }

    if (req.method === 'POST') {
      const body = bodyOf(req);
      if (body.action === 'publish') {
        await safeCaptureRecoverySnapshot('Before Visual Editor publish','Visual Editor');
        const state = await publishVisualEditorDraft('Rebecca Visual Editor');
        try {
          await recordSystemEvent({
            area:'Website',
            type:'publish',
            summary:'Visual Editor Draft was published to the live website and concierge data.',
            source:'Visual Editor'
          });
        } catch {}
        return res.status(200).json(responseShape(state));
      }
      if (body.action === 'discard') {
        return res.status(200).json(
          responseShape(await discardVisualEditorDraft('Rebecca Visual Editor'))
        );
      }
      return res.status(400).json({ error: 'Unknown visual editor action.' });
    }

    return res.status(405).json({ error: 'Use GET, PUT or POST.' });
  } catch (error) {
    if (error?.code === 'STORE_CONFLICT') {
      return res.status(409).json({ error: error.message });
    }
    if (error?.code === 'STORE_NOT_CONFIGURED' || error?.code === 'STORE_UNAVAILABLE') {
      return res.status(503).json({ error: 'Visual editing is temporarily unavailable.' });
    }
    if (error?.code === 'VISUAL_DRAFT_EMPTY') {
      return res.status(409).json({ error: error.message });
    }
    console.error('RC-05 visual editor API failed:', error);
    return res.status(500).json({ error: 'Could not update the visual draft safely.' });
  }
}
