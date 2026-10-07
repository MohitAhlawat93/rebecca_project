import { normalizeGoogleRows } from './search-measurement-engine.mjs';

const ENDPOINT = 'https://www.googleapis.com/webmasters/v3/sites';

export function googleSearchConfigured(config, env = process.env) {
  const google = config?.providers?.google?.standard || {};
  return Boolean(
    String(google.property || env.GSC_SITE_URL || '').trim() &&
    String(env[google.tokenEnv || 'GSC_ACCESS_TOKEN'] || '').trim()
  );
}

export function buildGoogleWindowRequests(config, startDate, endDate) {
  const google = config.providers.google.standard;
  const dimensions = ['date', 'query', 'page', 'country', 'device'];
  return (google.searchTypes || ['web']).map((type) => ({
    type,
    body: {
      startDate,
      endDate,
      type,
      dimensions,
      rowLimit: Math.min(25000, Number(google.rowLimit) || 25000),
      startRow: 0,
      dataState: 'final',
      aggregationType: 'auto'
    }
  }));
}

export async function fetchGoogleWindow(config, startDate, endDate, {
  fetchImpl = fetch,
  env = process.env
} = {}) {
  const google = config.providers.google.standard;
  const property = String(google.property || env.GSC_SITE_URL || '').trim();
  const token = String(env[google.tokenEnv || 'GSC_ACCESS_TOKEN'] || '').trim();
  if (!property || !token) {
    const error = new Error('Google Search Console is not connected.');
    error.code = 'GSC_NOT_CONFIGURED';
    throw error;
  }

  const requests = buildGoogleWindowRequests(config, startDate, endDate);
  const all = [];

  for (const request of requests) {
    let startRow = 0;
    while (true) {
      const body = { ...request.body, startRow };
      const response = await fetchImpl(
        ENDPOINT + '/' + encodeURIComponent(property) + '/searchAnalytics/query',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        const error = new Error(
          'Google Search Console request failed (' + response.status + ')' +
          (detail ? ': ' + detail.slice(0, 300) : '')
        );
        error.code = 'GSC_REQUEST_FAILED';
        error.status = response.status;
        throw error;
      }

      const payload = await response.json();
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      all.push(...normalizeGoogleRows(rows, {
        surface: request.type,
        dimensions: body.dimensions
      }));

      if (rows.length < body.rowLimit) break;
      startRow += body.rowLimit;
    }
  }

  return all;
}
