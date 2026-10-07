import { getAdminSession } from '../../lib/admin-auth.js';
import {
  adminStoreConfigured,
  readQuickControlState,
  writeQuickControlState
} from '../../lib/admin-store.js';
import { evaluateQuickControlSchedules } from '../../lib/schedule-engine.js';

function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}

function readBody(req) {
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

  if (req.method === 'GET') {
    const current = await readQuickControlState();
    const evaluated = evaluateQuickControlSchedules(current.state);
    return res.status(200).json({
      ok: true,
      configured: adminStoreConfigured(),
      ...current,
      effectiveState: evaluated.state,
      schedule: evaluated.schedule
    });
  }

  if (req.method === 'PUT') {
    const body = readBody(req);
    try {
      const saved = await writeQuickControlState(body.state, 'Rebecca');
      const evaluated = evaluateQuickControlSchedules(saved.state);
      return res.status(200).json({
        ok: true,
        ...saved,
        effectiveState: evaluated.state,
        schedule: evaluated.schedule
      });
    } catch (error) {
      if (error?.code === 'STORE_NOT_CONFIGURED' || error?.code === 'STORE_UNAVAILABLE') {
        return res.status(503).json({
          error: 'Quick Control storage is not available right now. No public content was changed.'
        });
      }
      if (error?.code === 'STORE_CONFLICT') {
        return res.status(409).json({
          error: 'This content changed in another session. Reload Rebecca Control before saving again.'
        });
      }
      console.error('RC-04 save failed:', error);
      return res.status(500).json({ error: 'Could not save this change safely.' });
    }
  }

  return res.status(405).json({ error: 'Use GET or PUT.' });
}
