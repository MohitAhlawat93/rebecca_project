import { SEARCH_MEASUREMENT } from '../seo/search-measurement.config.mjs';
import {
  buildSearchIntelligence,
  normalizeBingAiPerformance,
  normalizeGoogleGenerativeAiExport,
  normalizeGoogleMultimodalExport
} from './search-measurement-engine.mjs';
import {
  fetchGoogleWindow,
  googleSearchConfigured
} from './search-provider-google.mjs';
import {
  bingWebmasterConfigured,
  fetchBingStandard
} from './search-provider-bing.mjs';

export function resolveMeasurementWindows(config = SEARCH_MEASUREMENT, now = new Date()) {
  const days = Math.max(1, Number(config.reporting?.currentWindowDays) || 28);
  const previousDays = Math.max(1, Number(config.reporting?.comparisonWindowDays) || days);
  const lag = Math.max(0, Number(config.reporting?.finalizedLagDays) || 3);

  const end = utcDate(now);
  end.setUTCDate(end.getUTCDate() - lag);

  const currentStart = new Date(end);
  currentStart.setUTCDate(currentStart.getUTCDate() - (days - 1));

  const previousEnd = new Date(currentStart);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - (previousDays - 1));

  return {
    current: { startDate: key(currentStart), endDate: key(end) },
    previous: { startDate: key(previousStart), endDate: key(previousEnd) }
  };
}

export function searchProviderStatus(config = SEARCH_MEASUREMENT, env = process.env) {
  const googleConnected = googleSearchConfigured(config, env);
  const bingConnected = bingWebmasterConfigured(config, env);
  return {
    googleStandard: {
      state: googleConnected ? 'connected' : 'needs-connection',
      mode: config.providers.google.standard.mode,
      propertyConfigured: Boolean(config.providers.google.standard.property || env.GSC_SITE_URL)
    },
    googleGenerativeAi: {
      state: 'export-required',
      mode: config.providers.google.generativeAi.mode,
      apiStatus: config.providers.google.generativeAi.apiStatus
    },
    googleMultimodal: {
      state: 'export-required',
      mode: config.providers.google.multimodal.mode,
      apiStatus: config.providers.google.multimodal.apiStatus
    },
    bingStandard: {
      state: bingConnected ? 'connected' : 'needs-connection',
      mode: config.providers.bing.standard.mode,
      siteConfigured: Boolean(config.providers.bing.standard.siteUrl || env.BING_SITE_URL)
    },
    bingAiPerformance: {
      state: 'portal-export-required',
      mode: config.providers.bing.aiPerformance.mode,
      apiStatus: config.providers.bing.aiPerformance.apiStatus
    }
  };
}

export async function buildLiveSearchIntelligence({
  config = SEARCH_MEASUREMENT,
  now = new Date(),
  env = process.env,
  fetchImpl = fetch,
  includeLive = true,
  imports = {}
} = {}) {
  const windows = resolveMeasurementWindows(config, now);
  const providerStatus = searchProviderStatus(config, env);
  const current = [];
  const previous = [];
  const errors = [];

  if (includeLive && providerStatus.googleStandard.state === 'connected') {
    try {
      const [currentRows, previousRows] = await Promise.all([
        fetchGoogleWindow(config, windows.current.startDate, windows.current.endDate, { fetchImpl, env }),
        fetchGoogleWindow(config, windows.previous.startDate, windows.previous.endDate, { fetchImpl, env })
      ]);
      current.push(...currentRows);
      previous.push(...previousRows);
      providerStatus.googleStandard.lastAttempt = 'success';
    } catch (error) {
      providerStatus.googleStandard.lastAttempt = 'error';
      errors.push(safeProviderError('google-standard', error));
    }
  }

  if (includeLive && providerStatus.bingStandard.state === 'connected') {
    try {
      const rows = await fetchBingStandard(config, { fetchImpl, env });
      current.push(...partition(rows, windows.current));
      previous.push(...partition(rows, windows.previous));
      providerStatus.bingStandard.lastAttempt = 'success';
    } catch (error) {
      providerStatus.bingStandard.lastAttempt = 'error';
      errors.push(safeProviderError('bing-standard', error));
    }
  }

  addImports(current, imports.current || imports, 'current');
  addImports(previous, imports.previous || {}, 'previous');

  const intelligence = buildSearchIntelligence({
    current,
    previous,
    config,
    providerStatus
  });

  return {
    ...intelligence,
    windows,
    errors,
    dataPolicy: {
      storesCredentials: false,
      storesRawVisitorIdentity: false,
      notes: [
        'Provider credentials remain server-side environment variables.',
        'Search measurement uses aggregate search-performance records, not visitor identity.',
        'AI/export-only surfaces are never presented as live API data.'
      ]
    }
  };
}

function addImports(target, imports, period) {
  if (!imports || typeof imports !== 'object') return;
  target.push(...normalizeGoogleGenerativeAiExport(imports.googleGenerativeAi || []));
  target.push(...normalizeGoogleMultimodalExport(imports.googleMultimodal || []));
  target.push(...normalizeBingAiPerformance(imports.bingAiPerformance || []));
  if (Array.isArray(imports.normalizedRows)) {
    target.push(...imports.normalizedRows.map((row) => ({ ...row, importedPeriod: period })));
  }
}

function partition(rows, window) {
  return rows.filter((row) => {
    if (!row.date) return false;
    return row.date >= window.startDate && row.date <= window.endDate;
  });
}

function safeProviderError(provider, error) {
  return {
    provider,
    code: String(error?.code || 'PROVIDER_ERROR'),
    message: String(error?.message || 'Provider request failed.').slice(0, 240)
  };
}

function utcDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return utcDate(new Date());
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function key(date) {
  return date.toISOString().slice(0, 10);
}
