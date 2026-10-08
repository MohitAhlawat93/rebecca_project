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
import publishingOverview from '../../server/admin/publishing-overview.js';
import launchReadiness from '../../server/admin/launch-readiness.js';
import searchConnect from '../../server/admin/search-connect.js';
import searchImport from '../../server/admin/search-import.js';
import searchIntelligence from '../../server/admin/search-intelligence.js';
import searchOauthCallback from '../../server/admin/search-oauth-callback.js';
import searchSync from '../../server/admin/search-sync.js';
import { validateOwnerWriteOrigin } from '../../lib/admin-origin-guard.js';

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
  insights,
  'publishing-overview': publishingOverview,
  'launch-readiness': launchReadiness,
  'search-connect': searchConnect,
  'search-import': searchImport,
  'search-intelligence': searchIntelligence,
  'search-oauth-callback': searchOauthCallback,
  'search-sync': searchSync
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

  // Vercel Blob's verified upload-completion callback has its own validation
  // and may not carry the owner's browser Origin header.
  if (route !== 'media-upload') {
    const origin = validateOwnerWriteOrigin(req);
    if (!origin.allowed) {
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return res.status(403).json({ error: origin.reason });
    }
  }

  return target(req, res);
}
