import login from '../../server/admin/login.js';
import logout from '../../server/admin/logout.js';
import session from '../../server/admin/session.js';
import quickControl from '../../server/admin/quick-control.js';
import media from '../../server/admin/media.js';
import mediaUpload from '../../server/admin/media-upload.js';
import visualEditor from '../../server/admin/visual-editor.js';
import conciergeControl from '../../server/admin/concierge-control.js';
import conciergeTest from '../../server/admin/concierge-test.js';
import needsRebecca from '../../server/admin/needs-rebecca.js';
import assistantPropose from '../../server/admin/assistant-propose.js';
import assistantApply from '../../server/admin/assistant-apply.js';
import system from '../../server/admin/system.js';
import insights from '../../server/admin/insights.js';

const ROUTES = {
  login,
  logout,
  session,
  'quick-control': quickControl,
  media,
  'media-upload': mediaUpload,
  'visual-editor': visualEditor,
  'concierge-control': conciergeControl,
  'concierge-test': conciergeTest,
  'needs-rebecca': needsRebecca,
  'assistant-propose': assistantPropose,
  'assistant-apply': assistantApply,
  system,
  insights
};

export default async function handler(req, res) {
  const raw = req?.query?.route;
  const route = Array.isArray(raw) ? raw[0] : String(raw || '');
  const target = ROUTES[route];

  if (!target) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res.status(404).json({ error: 'Unknown Rebecca Control route.' });
  }

  return target(req, res);
}
