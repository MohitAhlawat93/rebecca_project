import crypto from 'node:crypto';
import { SEARCH_MEASUREMENT } from '../seo/search-measurement.config.mjs';
import {
  buildSearchIntelligence,
  normalizeBingAiPerformance,
  normalizeGoogleGenerativeAiExport,
  normalizeGoogleMultimodalExport
} from './search-measurement-engine.mjs';
import { resolveMeasurementWindows } from './search-measurement-service.mjs';
import { fetchGoogleWindow } from './search-provider-google.mjs';
import { fetchBingStandard } from './search-provider-bing.mjs';
import {
  getBingAuthentication,
  getSearchAccessToken,
  providerConnectionStatus
} from './search-provider-tokens.mjs';
import {
  finishSyncRun,
  readAllSyncState,
  readMetricRows,
  searchStoreConfigured,
  startSyncRun,
  updateSyncState,
  upsertMetricRows
} from './search-persistence-store.mjs';

export function resolveSyncWindow(config = SEARCH_MEASUREMENT, now = new Date()) {
  const lag = Math.max(0, Number(config.reporting?.finalizedLagDays) || 3);
  const lookback = Math.max(
    Number(config.reporting?.currentWindowDays) || 28,
    Number(config.sync?.lookbackDays) || 35
  );

  const end = utcDate(now);
  end.setUTCDate(end.getUTCDate() - lag);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (lookback - 1));

  return { startDate: key(start), endDate: key(end) };
}

export async function syncAllSearchProviders({
  config = SEARCH_MEASUREMENT,
  now = new Date(),
  trigger = 'manual',
  env = process.env,
  fetchImpl = fetch
} = {}) {
  if (!searchStoreConfigured(env)) {
    const error = new Error('Search persistence is not configured.');
    error.code = 'SEARCH_STORE_NOT_CONFIGURED';
    throw error;
  }

  const providers = Array.isArray(config.sync?.providers)
    ? config.sync.providers
    : ['google', 'bing'];

  const results = [];
  for (const provider of providers) {
    results.push(
      await syncSearchProvider(provider, {
        config,
        now,
        trigger,
        env,
        fetchImpl
      })
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    window: resolveSyncWindow(config, now),
    results,
    success: results.every((item) => ['success', 'skipped'].includes(item.status))
  };
}

export async function syncSearchProvider(
  provider,
  {
    config = SEARCH_MEASUREMENT,
    now = new Date(),
    trigger = 'manual',
    env = process.env,
    fetchImpl = fetch
  } = {}
) {
  const clientId = config.clientId;
  const window = resolveSyncWindow(config, now);
  const readiness = await providerConnectionStatus(provider, {
    clientId,
    env,
    fetchImpl
  });

  if (readiness.state !== 'connected') {
    return {
      provider,
      status: 'skipped',
      reason: readiness.state,
      readiness,
      window
    };
  }

  const idempotencyKey = [
    'search-sync-v1',
    provider,
    window.startDate,
    window.endDate
  ].join(':');

  const run = await startSyncRun(
    {
      clientId,
      provider,
      surface: provider === 'google' ? 'web+image' : 'standard',
      trigger,
      idempotencyKey,
      windowStart: window.startDate,
      windowEnd: window.endDate
    },
    { env, fetchImpl }
  );

  if (run?.skipped) {
    return {
      provider,
      status: 'skipped',
      reason: 'already-synced',
      rowsWritten: Number(run.rows_written) || 0,
      window
    };
  }

  try {
    let rows = [];

    if (provider === 'google') {
      const token = await getSearchAccessToken('google', {
        clientId,
        env,
        fetchImpl
      });
      rows = await fetchGoogleWindow(
        config,
        window.startDate,
        window.endDate,
        {
          env,
          fetchImpl,
          accessToken: token.accessToken
        }
      );
    } else if (provider === 'bing') {
      const auth = await getBingAuthentication({
        clientId,
        env,
        fetchImpl
      });
      const received = await fetchBingStandard(config, {
        env,
        fetchImpl,
        accessToken: auth.accessToken,
        apiKey: auth.apiKey
      });
      rows = received.filter((row) =>
        !row.date || (row.date >= window.startDate && row.date <= window.endDate)
      );
    } else {
      const error = new Error('Unsupported search provider: ' + provider);
      error.code = 'SEARCH_PROVIDER_UNSUPPORTED';
      throw error;
    }

    const rowsWritten = await upsertMetricRows(clientId, rows, {
      windowStart: window.startDate,
      windowEnd: window.endDate,
      env,
      fetchImpl
    });

    await finishSyncRun(
      run.id,
      { status: 'success', rowsWritten },
      { env, fetchImpl }
    );
    await updateSyncState(
      {
        clientId,
        provider,
        surface: 'all',
        success: true,
        windowStart: window.startDate,
        windowEnd: window.endDate
      },
      { env, fetchImpl }
    );

    return {
      provider,
      status: 'success',
      rowsWritten,
      window
    };
  } catch (error) {
    const code = String(error?.code || 'SEARCH_SYNC_FAILED');
    const message = String(error?.message || 'Search sync failed.').slice(0, 500);

    if (run?.id) {
      await finishSyncRun(
        run.id,
        {
          status: 'error',
          rowsWritten: 0,
          errorCode: code,
          errorMessage: message
        },
        { env, fetchImpl }
      ).catch(() => {});
    }

    await updateSyncState(
      {
        clientId,
        provider,
        surface: 'all',
        success: false,
        errorCode: code,
        errorMessage: message
      },
      { env, fetchImpl }
    ).catch(() => {});

    return {
      provider,
      status: 'error',
      error: { code, message },
      window
    };
  }
}

export async function persistSearchExport(
  kind,
  rows,
  {
    config = SEARCH_MEASUREMENT,
    env = process.env,
    fetchImpl = fetch
  } = {}
) {
  const normalized = normalizeImport(kind, rows);
  if (!normalized.length) {
    return { status: 'skipped', reason: 'empty-import', rowsWritten: 0 };
  }

  const dates = normalized.map((row) => row.date).filter(Boolean).sort();
  const windowStart = dates[0] || null;
  const windowEnd = dates[dates.length - 1] || null;
  const provider = kind.startsWith('bing') ? 'bing' : 'google';
  const digest = crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')
    .slice(0, 24);
  const idempotencyKey = ['search-import-v1', kind, digest].join(':');

  const run = await startSyncRun(
    {
      clientId: config.clientId,
      provider,
      surface: kind,
      trigger: 'import',
      idempotencyKey,
      windowStart,
      windowEnd
    },
    { env, fetchImpl }
  );

  if (run?.skipped) {
    return {
      status: 'skipped',
      reason: 'already-imported',
      rowsWritten: Number(run.rows_written) || 0
    };
  }

  try {
    const rowsWritten = await upsertMetricRows(config.clientId, normalized, {
      windowStart,
      windowEnd,
      env,
      fetchImpl
    });
    await finishSyncRun(
      run.id,
      { status: 'success', rowsWritten },
      { env, fetchImpl }
    );
    await updateSyncState(
      {
        clientId: config.clientId,
        provider,
        surface: kind,
        success: true,
        windowStart,
        windowEnd
      },
      { env, fetchImpl }
    );
    return { status: 'success', rowsWritten, windowStart, windowEnd };
  } catch (error) {
    await finishSyncRun(
      run.id,
      {
        status: 'error',
        errorCode: String(error?.code || 'SEARCH_IMPORT_FAILED'),
        errorMessage: String(error?.message || 'Search export import failed.')
      },
      { env, fetchImpl }
    ).catch(() => {});
    throw error;
  }
}

export async function buildPersistedSearchIntelligence({
  config = SEARCH_MEASUREMENT,
  now = new Date(),
  env = process.env,
  fetchImpl = fetch
} = {}) {
  if (!searchStoreConfigured(env)) {
    const error = new Error('Search persistence is not configured.');
    error.code = 'SEARCH_STORE_NOT_CONFIGURED';
    throw error;
  }

  const windows = resolveMeasurementWindows(config, now);
  const [current, previous, google, bing, syncState] = await Promise.all([
    readMetricRows(
      config.clientId,
      windows.current.startDate,
      windows.current.endDate,
      { env, fetchImpl }
    ),
    readMetricRows(
      config.clientId,
      windows.previous.startDate,
      windows.previous.endDate,
      { env, fetchImpl }
    ),
    providerConnectionStatus('google', {
      clientId: config.clientId,
      env,
      fetchImpl
    }),
    providerConnectionStatus('bing', {
      clientId: config.clientId,
      env,
      fetchImpl
    }),
    readAllSyncState(config.clientId, { env, fetchImpl })
  ]);

  const providerStatus = {
    googleStandard: google,
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
    bingStandard: bing,
    bingAiPerformance: {
      state: 'portal-export-required',
      mode: config.providers.bing.aiPerformance.mode,
      apiStatus: config.providers.bing.aiPerformance.apiStatus
    }
  };

  return {
    ...buildSearchIntelligence({
      current,
      previous,
      config,
      providerStatus
    }),
    windows,
    persistence: {
      mode: 'supabase',
      clientId: config.clientId,
      currentRows: current.length,
      previousRows: previous.length,
      syncState
    },
    dataPolicy: {
      storesEncryptedProviderTokens: true,
      storesRawVisitorIdentity: false,
      notes: [
        'OAuth provider tokens are encrypted with AES-256-GCM before persistence.',
        'The database stores aggregate search-performance rows, not visitor identity.',
        'Scheduled syncs are idempotent and retain historical finalized windows.'
      ]
    }
  };
}

function normalizeImport(kind, rows) {
  const input = Array.isArray(rows) ? rows : [];
  if (kind === 'google-generative-ai') {
    return normalizeGoogleGenerativeAiExport(input);
  }
  if (kind === 'google-multimodal') {
    return normalizeGoogleMultimodalExport(input);
  }
  if (kind === 'bing-ai-performance') {
    return normalizeBingAiPerformance(input);
  }
  const error = new Error('Unsupported search export kind.');
  error.code = 'SEARCH_IMPORT_KIND';
  throw error;
}

function utcDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return utcDate(new Date());
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function key(date) {
  return date.toISOString().slice(0, 10);
}
