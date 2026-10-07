import { getAdminSession } from '../../lib/admin-auth.js';
import {
  buildSearchAuthorizationUrl,
  searchOAuthConfigured
} from '../../lib/search-oauth.mjs';
import { SEARCH_MEASUREMENT } from '../../seo/search-measurement.config.mjs';

export default async function handler(req, res) {
  noCache(res);
  if (!getAdminSession(req)) return res.status(401).json({ error: 'Owner session required.' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });

  const provider = String(req.query?.provider || '').toLowerCase();
  if (!['google', 'bing'].includes(provider)) {
    return res.status(400).json({ error: 'Choose google or bing.' });
  }

  if (!searchOAuthConfigured(provider)) {
    return res.status(409).json({
      error: provider + ' OAuth client is not configured yet.',
      provider,
      required: provider === 'google'
        ? ['GOOGLE_SEARCH_CLIENT_ID', 'GOOGLE_SEARCH_CLIENT_SECRET', 'GSC_SITE_URL']
        : ['BING_WEBMASTER_CLIENT_ID', 'BING_WEBMASTER_CLIENT_SECRET', 'BING_SITE_URL'],
      redirectUri:
        String(process.env.SEARCH_OAUTH_REDIRECT_ORIGIN || '').replace(/\/$/, '') +
        '/api/admin/search-oauth-callback'
    });
  }

  try {
    return res.status(200).json({
      ok: true,
      provider,
      authorizationUrl: buildSearchAuthorizationUrl(provider, {
        clientId: SEARCH_MEASUREMENT.clientId,
        returnPath: '/admin.html?tab=search'
      })
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Could not prepare search-provider connection safely.',
      code: error?.code || 'SEARCH_OAUTH_START_FAILED'
    });
  }
}

function noCache(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}
