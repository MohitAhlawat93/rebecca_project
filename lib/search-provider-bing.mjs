import { normalizeBingRows } from './search-measurement-engine.mjs';

const ROOT = 'https://www.bing.com/webmaster/api.svc/json';

export function bingWebmasterConfigured(config, env = process.env) {
  const bing = config?.providers?.bing?.standard || {};
  const hasSite = Boolean(String(bing.siteUrl || env.BING_SITE_URL || '').trim());
  const hasCredential = Boolean(
    String(env[bing.oauthTokenEnv || 'BING_WEBMASTER_ACCESS_TOKEN'] || '').trim() ||
    String(env[bing.apiKeyEnv || 'BING_WEBMASTER_API_KEY'] || '').trim()
  );
  return hasSite && hasCredential;
}

export async function fetchBingStandard(config, {
  fetchImpl = fetch,
  env = process.env
} = {}) {
  const bing = config.providers.bing.standard;
  const siteUrl = String(bing.siteUrl || env.BING_SITE_URL || '').trim();
  const token = String(env[bing.oauthTokenEnv || 'BING_WEBMASTER_ACCESS_TOKEN'] || '').trim();
  const apiKey = String(env[bing.apiKeyEnv || 'BING_WEBMASTER_API_KEY'] || '').trim();

  if (!siteUrl || (!token && !apiKey)) {
    const error = new Error('Bing Webmaster Tools is not connected.');
    error.code = 'BING_NOT_CONFIGURED';
    throw error;
  }

  const [queryRows, pageRows] = await Promise.all([
    call('GetQueryStats', siteUrl, token, apiKey, fetchImpl),
    call('GetPageStats', siteUrl, token, apiKey, fetchImpl)
  ]);

  const queries = normalizeBingRows(queryRows, { surface: 'standard' });
  const pages = normalizeBingRows(pageRows, { surface: 'standard' }).map((row) => ({
    ...row,
    page: row.query,
    query: ''
  }));

  return [...queries, ...pages];
}

async function call(method, siteUrl, token, apiKey, fetchImpl) {
  const url = new URL(ROOT + '/' + method);
  url.searchParams.set('siteUrl', siteUrl);
  if (apiKey && !token) url.searchParams.set('apikey', apiKey);

  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    }
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const error = new Error(
      'Bing Webmaster request failed (' + response.status + ')' +
      (detail ? ': ' + detail.slice(0, 300) : '')
    );
    error.code = 'BING_REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.d)) return payload.d;
  if (Array.isArray(payload?.value)) return payload.value;
  return [];
}
