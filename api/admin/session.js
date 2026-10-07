import { getAdminSession, adminAuthConfigured } from '../../lib/admin-auth.js';
import { getAdminDashboardSnapshot } from '../../lib/admin-store.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });

  if (!adminAuthConfigured()) {
    return res.status(503).json({
      authenticated: false,
      configured: false,
      error: 'Rebecca Control is not configured yet.'
    });
  }

  const session = getAdminSession(req);
  if (!session) return res.status(401).json({ authenticated: false, configured: true });

  const site = await getAdminDashboardSnapshot();

  return res.status(200).json({
    authenticated: true,
    configured: true,
    owner: {
      name: 'Rebecca',
      role: 'Owner'
    },
    control: {
      version: 'RC-06',
      status: 'Concierge Control',
      storeMode: site.storeMode,
      persistent: site.persistent
    },
    site
  });
}
