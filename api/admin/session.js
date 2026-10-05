import { getAdminSession, adminAuthConfigured } from '../../lib/admin-auth.js';
import { REBECCA_DATA } from '../../data/rebecca-data.js';

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

  return res.status(200).json({
    authenticated: true,
    configured: true,
    owner: {
      name: 'Rebecca',
      role: 'Owner'
    },
    control: {
      version: 'RC-01',
      status: 'Foundation active'
    },
    site: {
      dataVersion: REBECCA_DATA.meta?.dataVersion || '—',
      lastVerified: REBECCA_DATA.meta?.lastVerified || '—',
      base: REBECCA_DATA.profile?.base || '—',
      singaporeRateCount: Array.isArray(REBECCA_DATA.singapore?.rates) ? REBECCA_DATA.singapore.rates.length : 0,
      travelWindowCount: Array.isArray(REBECCA_DATA.travel?.calendar) ? REBECCA_DATA.travel.calendar.length : 0
    }
  });
}
