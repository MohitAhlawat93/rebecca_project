import crypto from 'node:crypto';

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const BING_AUTH = 'https://www.bing.com/webmasters/oauth/authorize';
const BING_TOKEN = 'https://www.bing.com/webmasters/oauth/token';

export function searchOAuthConfigured(provider, env = process.env) {
  const origin = String(env.SEARCH_OAUTH_REDIRECT_ORIGIN || '').trim();
  const stateSecret = String(env.SEARCH_OAUTH_STATE_SECRET || '').trim();
  if (!origin || !stateSecret) return false;

  if (provider === 'google') {
    return Boolean(
      String(env.GOOGLE_SEARCH_CLIENT_ID || '').trim() &&
      String(env.GOOGLE_SEARCH_CLIENT_SECRET || '').trim()
    );
  }
  if (provider === 'bing') {
    return Boolean(
      String(env.BING_WEBMASTER_CLIENT_ID || '').trim() &&
      String(env.BING_WEBMASTER_CLIENT_SECRET || '').trim()
    );
  }
  return false;
}

export function oauthRedirectUri(env = process.env) {
  const origin = String(env.SEARCH_OAUTH_REDIRECT_ORIGIN || '').trim().replace(/\/$/, '');
  if (!origin) {
    const error = new Error('SEARCH_OAUTH_REDIRECT_ORIGIN is not configured.');
    error.code = 'SEARCH_OAUTH_REDIRECT_ORIGIN_MISSING';
    throw error;
  }
  return origin + '/api/admin/search-oauth-callback';
}

export function buildSearchAuthorizationUrl(
  provider,
  {
    clientId = 'risque-rebecca',
    returnPath = '/admin.html',
    env = process.env,
    now = Date.now()
  } = {}
) {
  if (!searchOAuthConfigured(provider, env)) {
    const error = new Error(provider + ' OAuth client is not configured.');
    error.code = 'SEARCH_OAUTH_NOT_CONFIGURED';
    throw error;
  }

  const state = signState(
    {
      provider,
      clientId,
      returnPath: safeReturnPath(returnPath),
      iat: now,
      exp: now + 10 * 60 * 1000,
      nonce: crypto.randomBytes(18).toString('base64url')
    },
    env
  );

  const redirectUri = oauthRedirectUri(env);
  if (provider === 'google') {
    const url = new URL(GOOGLE_AUTH);
    url.searchParams.set('client_id', String(env.GOOGLE_SEARCH_CLIENT_ID));
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'https://www.googleapis.com/auth/webmasters.readonly');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('include_granted_scopes', 'true');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);
    return url.toString();
  }

  if (provider === 'bing') {
    const url = new URL(BING_AUTH);
    url.searchParams.set('client_id', String(env.BING_WEBMASTER_CLIENT_ID));
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'Webmaster.read');
    url.searchParams.set('state', state);
    return url.toString();
  }

  const error = new Error('Unsupported search provider.');
  error.code = 'SEARCH_OAUTH_PROVIDER';
  throw error;
}

export async function exchangeSearchAuthorizationCode(
  provider,
  code,
  { env = process.env, fetchImpl = fetch } = {}
) {
  if (!code) {
    const error = new Error('Authorization code is missing.');
    error.code = 'SEARCH_OAUTH_CODE_MISSING';
    throw error;
  }
  const redirectUri = oauthRedirectUri(env);

  if (provider === 'google') {
    return tokenRequest(
      GOOGLE_TOKEN,
      {
        code,
        client_id: env.GOOGLE_SEARCH_CLIENT_ID,
        client_secret: env.GOOGLE_SEARCH_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      },
      fetchImpl
    );
  }

  if (provider === 'bing') {
    return tokenRequest(
      BING_TOKEN,
      {
        code,
        client_id: env.BING_WEBMASTER_CLIENT_ID,
        client_secret: env.BING_WEBMASTER_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      },
      fetchImpl
    );
  }

  const error = new Error('Unsupported search provider.');
  error.code = 'SEARCH_OAUTH_PROVIDER';
  throw error;
}

export async function refreshSearchAccessToken(
  provider,
  refreshToken,
  { env = process.env, fetchImpl = fetch } = {}
) {
  if (!refreshToken) {
    const error = new Error('Refresh token is missing.');
    error.code = 'SEARCH_REFRESH_TOKEN_MISSING';
    throw error;
  }

  if (provider === 'google') {
    return tokenRequest(
      GOOGLE_TOKEN,
      {
        client_id: env.GOOGLE_SEARCH_CLIENT_ID,
        client_secret: env.GOOGLE_SEARCH_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      },
      fetchImpl
    );
  }

  if (provider === 'bing') {
    return tokenRequest(
      BING_TOKEN,
      {
        client_id: env.BING_WEBMASTER_CLIENT_ID,
        client_secret: env.BING_WEBMASTER_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      },
      fetchImpl
    );
  }

  const error = new Error('Unsupported search provider.');
  error.code = 'SEARCH_OAUTH_PROVIDER';
  throw error;
}

export function verifySearchOAuthState(value, env = process.env, now = Date.now()) {
  try {
    const [payloadRaw, signature] = String(value || '').split('.');
    if (!payloadRaw || !signature) return null;

    const expected = hmac(payloadRaw, env);
    if (!safeEqual(signature, expected)) return null;

    const payload = JSON.parse(Buffer.from(payloadRaw, 'base64url').toString('utf8'));
    if (!payload?.provider || !payload?.clientId || !payload?.exp) return null;
    if (!['google', 'bing'].includes(payload.provider)) return null;
    if (Number(payload.exp) < now) return null;
    return {
      provider: payload.provider,
      clientId: String(payload.clientId),
      returnPath: safeReturnPath(payload.returnPath || '/admin.html'),
      iat: Number(payload.iat) || 0,
      exp: Number(payload.exp)
    };
  } catch {
    return null;
  }
}

export function tokenExpiryIso(tokenResponse, now = Date.now()) {
  const seconds = Number(tokenResponse?.expires_in);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(now + Math.max(0, seconds - 60) * 1000).toISOString();
}

function signState(payload, env) {
  const raw = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return raw + '.' + hmac(raw, env);
}

function hmac(value, env) {
  const secret = String(env.SEARCH_OAUTH_STATE_SECRET || '').trim();
  if (secret.length < 32) {
    const error = new Error('SEARCH_OAUTH_STATE_SECRET must be at least 32 characters.');
    error.code = 'SEARCH_OAUTH_STATE_SECRET_INVALID';
    throw error;
  }
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function safeReturnPath(value) {
  const path = String(value || '/admin.html');
  if (!path.startsWith('/') || path.startsWith('//')) return '/admin.html';
  return path.slice(0, 300);
}

async function tokenRequest(endpoint, values, fetchImpl) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && String(value) !== '') {
      body.set(key, String(value));
    }
  }

  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body
  });

  const payload = await response.json().catch(async () => ({
    error_description: await response.text().catch(() => '')
  }));

  if (!response.ok || payload?.error) {
    const error = new Error(
      String(payload?.error_description || payload?.error || 'OAuth token request failed.').slice(0, 400)
    );
    error.code = 'SEARCH_OAUTH_TOKEN_FAILED';
    error.status = response.status;
    throw error;
  }

  return payload;
}
