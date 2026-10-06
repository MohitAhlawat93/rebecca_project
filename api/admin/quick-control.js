import { getAdminSession } from '../../lib/admin-auth.js';
import {
  adminStoreConfigured,
  readQuickControlState,
  writeQuickControlState
} from '../../lib/admin-store.js';

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
    return res.status(200).json({
      ok: true,
      configured: adminStoreConfigured(),
      ...current
    });
  }

  if (req.method === 'PUT') {
    const body = readBody(req);
    try {
      const saved = await writeQuickControlState(body.state, 'Rebecca');
      return res.status(200).json({ ok: true, ...saved });
    } catch (error) {
      if (error?.code === 'STORE_NOT_CONFIGURED') {
        return res.status(503).json({
          error: 'RC-02 storage is ready in code but has not been connected yet. No public content was changed.'
        });
      }
      console.error('RC-02 save failed:', error);
      return res.status(500).json({ error: 'Could not save this change safely.' });
    }
  }

  return res.status(405).json({ error: 'Use GET or PUT.' });
}
