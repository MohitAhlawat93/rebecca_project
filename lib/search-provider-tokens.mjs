import {
  markProviderError,
  readProviderConnection,
  saveProviderConnection,
  searchStoreConfigured
} from './search-persistence-store.mjs';
import {
  refreshSearchAccessToken,
  tokenExpiryIso
} from './search-oauth.mjs';

export async function getSearchAccessToken(
  provider,
  {
    clientId = 'risque-rebecca',
    env = process.env,
    fetchImpl = fetch
  } = {}
) {
  let connection = null;

  if (searchStoreConfigured(env)) {
    try {
      connection = await readProviderConnection(clientId, provider, { env, fetchImpl });
    } catch (error) {
      console.error('Search provider connection read failed:', provider, error?.message || error);
    }
  }

  if (
    connection?.accessToken &&
    tokenStillUsable(connection.access_token_expires_at)
  ) {
    return {
      accessToken: connection.accessToken,
      source: 'persistent-oauth',
      expiresAt: connection.access_token_expires_at,
      connection
    };
  }

  const envAccessToken =
    provider === 'google'
      ? String(env.GSC_ACCESS_TOKEN || '').trim()
      : String(env.BING_WEBMASTER_ACCESS_TOKEN || '').trim();

  const refreshToken =
    connection?.refreshToken ||
    (provider === 'google'
      ? String(env.GSC_REFRESH_TOKEN || '').trim()
      : String(env.BING_WEBMASTER_REFRESH_TOKEN || '').trim());

  if (refreshToken && oauthClientConfigured(provider, env)) {
    try {
      const refreshed = await refreshSearchAccessToken(provider, refreshToken, {
        env,
        fetchImpl
      });
      const accessToken = String(refreshed.access_token || '').trim();
      if (!accessToken) throw tokenError('OAuth refresh returned no access token.');

      const expiresAt = tokenExpiryIso(refreshed);
      if (searchStoreConfigured(env)) {
        await saveProviderConnection(
          {
            clientId,
            provider,
            status: 'connected',
            siteUrl:
              provider === 'google'
                ? String(env.GSC_SITE_URL || '').trim() || connection?.site_url || null
                : String(env.BING_SITE_URL || '').trim() || connection?.site_url || null,
            scopes: connection?.scopes || providerScopes(provider),
            accessToken,
            refreshToken: refreshed.refresh_token || refreshToken,
            accessTokenExpiresAt: expiresAt,
            lastValidatedAt: new Date().toISOString(),
            lastErrorCode: null,
            lastErrorMessage: null
          },
          { env, fetchImpl }
        );
      }
      return {
        accessToken,
        source: connection ? 'persistent-refresh' : 'environment-refresh',
        expiresAt,
        connection
      };
    } catch (error) {
      if (searchStoreConfigured(env) && connection) {
        await markProviderError(clientId, provider, error, { env, fetchImpl }).catch(() => {});
      }
      if (!envAccessToken) throw error;
    }
  }

  if (envAccessToken) {
    return {
      accessToken: envAccessToken,
      source: 'environment-access-token',
      expiresAt: null,
      connection
    };
  }

  const error = tokenError(provider + ' search credentials are not connected.');
  error.code = 'SEARCH_PROVIDER_NOT_CONNECTED';
  throw error;
}

export async function getBingAuthentication(options = {}) {
  const env = options.env || process.env;
  const apiKey = String(env.BING_WEBMASTER_API_KEY || '').trim();
  if (apiKey) return { apiKey, accessToken: null, source: 'environment-api-key' };

  const token = await getSearchAccessToken('bing', options);
  return {
    apiKey: null,
    accessToken: token.accessToken,
    source: token.source,
    expiresAt: token.expiresAt
  };
}

export async function providerConnectionStatus(
  provider,
  {
    clientId = 'risque-rebecca',
    env = process.env,
    fetchImpl = fetch
  } = {}
) {
  const siteUrl =
    provider === 'google'
      ? String(env.GSC_SITE_URL || '').trim()
      : String(env.BING_SITE_URL || '').trim();

  let connection = null;
  if (searchStoreConfigured(env)) {
    try {
      connection = await readProviderConnection(clientId, provider, { env, fetchImpl });
    } catch {
      connection = null;
    }
  }

  const hasApiKey =
    provider === 'bing' && Boolean(String(env.BING_WEBMASTER_API_KEY || '').trim());
  const hasStaticAccess =
    provider === 'google'
      ? Boolean(String(env.GSC_ACCESS_TOKEN || '').trim())
      : Boolean(String(env.BING_WEBMASTER_ACCESS_TOKEN || '').trim());
  const hasRefresh =
    Boolean(connection?.refreshToken) ||
    (provider === 'google'
      ? Boolean(String(env.GSC_REFRESH_TOKEN || '').trim())
      : Boolean(String(env.BING_WEBMASTER_REFRESH_TOKEN || '').trim()));

  const credentialsReady =
    hasApiKey ||
    hasStaticAccess ||
    (hasRefresh && oauthClientConfigured(provider, env));

  return {
    provider,
    state:
      connection?.status === 'revoked'
        ? 'revoked'
        : siteUrl && credentialsReady
          ? 'connected'
          : 'needs-connection',
    siteConfigured: Boolean(siteUrl),
    durableRefreshConfigured: hasRefresh && oauthClientConfigured(provider, env),
    storedConnection: Boolean(connection),
    tokenExpiresAt: connection?.access_token_expires_at || null,
    lastValidatedAt: connection?.last_validated_at || null,
    lastErrorCode: connection?.last_error_code || null,
    lastErrorMessage: connection?.last_error_message || null
  };
}

function oauthClientConfigured(provider, env) {
  if (provider === 'google') {
    return Boolean(
      String(env.GOOGLE_SEARCH_CLIENT_ID || '').trim() &&
      String(env.GOOGLE_SEARCH_CLIENT_SECRET || '').trim()
    );
  }
  return Boolean(
    String(env.BING_WEBMASTER_CLIENT_ID || '').trim() &&
    String(env.BING_WEBMASTER_CLIENT_SECRET || '').trim()
  );
}

function providerScopes(provider) {
  return provider === 'google'
    ? ['https://www.googleapis.com/auth/webmasters.readonly']
    : ['Webmaster.read'];
}

function tokenStillUsable(value) {
  if (!value) return false;
  const expires = new Date(value).getTime();
  return Number.isFinite(expires) && expires > Date.now() + 5 * 60 * 1000;
}

function tokenError(message) {
  const error = new Error(message);
  error.code = 'SEARCH_TOKEN';
  return error;
}
