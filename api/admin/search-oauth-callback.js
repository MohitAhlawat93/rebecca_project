import {
  exchangeSearchAuthorizationCode,
  tokenExpiryIso,
  verifySearchOAuthState
} from '../../lib/search-oauth.mjs';
import { saveProviderConnection } from '../../lib/search-persistence-store.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (req.method !== 'GET') return res.status(405).send('Use GET.');

  const state = verifySearchOAuthState(req.query?.state);
  if (!state) return redirect(res, '/admin.html?search=oauth-state-invalid');

  if (req.query?.error) {
    return redirect(
      res,
      addQuery(state.returnPath, 'search=connection-denied&provider=' + encodeURIComponent(state.provider))
    );
  }

  try {
    const token = await exchangeSearchAuthorizationCode(
      state.provider,
      String(req.query?.code || '')
    );
    const siteUrl =
      state.provider === 'google'
        ? String(process.env.GSC_SITE_URL || '').trim()
        : String(process.env.BING_SITE_URL || '').trim();

    await saveProviderConnection({
      clientId: state.clientId,
      provider: state.provider,
      status: 'connected',
      siteUrl: siteUrl || null,
      scopes:
        state.provider === 'google'
          ? ['https://www.googleapis.com/auth/webmasters.readonly']
          : ['Webmaster.read'],
      accessToken: token.access_token,
      refreshToken: token.refresh_token || null,
      accessTokenExpiresAt: tokenExpiryIso(token),
      connectedAt: new Date().toISOString(),
      lastValidatedAt: new Date().toISOString()
    });

    return redirect(
      res,
      addQuery(state.returnPath, 'search=connected&provider=' + encodeURIComponent(state.provider))
    );
  } catch (error) {
    console.error('SEARCH-08 OAuth callback failed:', error);
    return redirect(
      res,
      addQuery(
        state.returnPath,
        'search=connection-error&provider=' +
          encodeURIComponent(state.provider) +
          '&code=' + encodeURIComponent(String(error?.code || 'oauth_failed'))
      )
    );
  }
}

function addQuery(path, query) {
  return path + (path.includes('?') ? '&' : '?') + query;
}

function redirect(res, destination) {
  res.statusCode = 302;
  res.setHeader('Location', destination);
  return res.end();
}
