import crypto from 'node:crypto';

const PAGE_SIZE = 1000;

export function searchStoreConfigured(env = process.env) {
  return Boolean(
    String(env.RC_SUPABASE_URL || '').trim() &&
    String(env.RC_SUPABASE_PUBLISHABLE_KEY || '').trim() &&
    String(env.SEARCH_STORE_SECRET || '').trim() &&
    String(env.SEARCH_TOKEN_ENCRYPTION_KEY || '').trim()
  );
}

export function searchStoreSecretHash(env = process.env) {
  const secret = String(env.SEARCH_STORE_SECRET || '').trim();
  if (!secret) throw configError('SEARCH_STORE_SECRET is not configured.');
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export function encryptSearchToken(value, env = process.env) {
  if (!value) return null;
  const key = encryptionKey(env);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptSearchToken(value, env = process.env) {
  if (!value) return null;
  const [version, ivRaw, tagRaw, encryptedRaw] = String(value).split('.');
  if (version !== 'v1' || !ivRaw || !tagRaw || !encryptedRaw) {
    const error = new Error('Stored provider token has an unsupported format.');
    error.code = 'SEARCH_TOKEN_FORMAT';
    throw error;
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey(env),
    Buffer.from(ivRaw, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

export async function readProviderConnection(
  clientId,
  provider,
  { env = process.env, fetchImpl = fetch } = {}
) {
  requireStore(env);
  const rows = await supabaseRequest(
    'search_provider_connections?client_id=eq.' + encodeURIComponent(clientId) +
      '&provider=eq.' + encodeURIComponent(provider) +
      '&select=client_id,provider,status,site_url,account_label,scopes,access_token_ciphertext,refresh_token_ciphertext,access_token_expires_at,connected_at,last_validated_at,last_error_code,last_error_message,updated_at&limit=1',
    { env, fetchImpl }
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  return {
    ...row,
    accessToken: decryptSearchToken(row.access_token_ciphertext, env),
    refreshToken: decryptSearchToken(row.refresh_token_ciphertext, env)
  };
}

export async function saveProviderConnection(
  input,
  { env = process.env, fetchImpl = fetch } = {}
) {
  requireStore(env);
  const now = new Date().toISOString();
  const current = await readProviderConnection(input.clientId, input.provider, {
    env,
    fetchImpl
  });

  const body = {
    client_id: input.clientId,
    provider: input.provider,
    status: input.status || current?.status || 'connected',
    site_url: input.siteUrl ?? current?.site_url ?? null,
    account_label: input.accountLabel ?? current?.account_label ?? null,
    scopes: Array.isArray(input.scopes) ? input.scopes : (current?.scopes || []),
    access_token_ciphertext:
      input.accessToken !== undefined
        ? encryptSearchToken(input.accessToken, env)
        : (current?.access_token_ciphertext || null),
    refresh_token_ciphertext:
      input.refreshToken !== undefined && input.refreshToken !== null
        ? encryptSearchToken(input.refreshToken, env)
        : (current?.refresh_token_ciphertext || null),
    access_token_expires_at:
      input.accessTokenExpiresAt ?? current?.access_token_expires_at ?? null,
    connected_at:
      input.connectedAt ?? current?.connected_at ?? (input.status === 'connected' ? now : null),
    last_validated_at:
      input.lastValidatedAt ?? current?.last_validated_at ?? null,
    last_error_code: input.lastErrorCode ?? null,
    last_error_message: input.lastErrorMessage ?? null,
    secret_hash: searchStoreSecretHash(env),
    updated_at: now
  };

  const rows = await supabaseRequest(
    'search_provider_connections?on_conflict=client_id,provider',
    {
      method: 'POST',
      body,
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      env,
      fetchImpl
    }
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function markProviderError(
  clientId,
  provider,
  error,
  options = {}
) {
  return saveProviderConnection(
    {
      clientId,
      provider,
      status: 'error',
      lastErrorCode: String(error?.code || 'PROVIDER_ERROR'),
      lastErrorMessage: String(error?.message || 'Provider request failed.').slice(0, 400)
    },
    options
  );
}

export async function upsertMetricRows(
  clientId,
  rows,
  {
    windowStart = null,
    windowEnd = null,
    env = process.env,
    fetchImpl = fetch
  } = {}
) {
  requireStore(env);
  if (!Array.isArray(rows) || !rows.length) return 0;
  const secretHash = searchStoreSecretHash(env);
  const now = new Date().toISOString();
  let written = 0;

  for (let offset = 0; offset < rows.length; offset += 500) {
    const chunk = rows.slice(offset, offset + 500).map((row) => ({
      client_id: clientId,
      row_key: metricRowKey(clientId, row),
      source: String(row.source || 'unknown'),
      surface: String(row.surface || 'web'),
      metric_date: normalizeDate(row.date),
      query: String(row.query || ''),
      page: String(row.page || ''),
      country: String(row.country || ''),
      device: String(row.device || ''),
      topic: String(row.topic || ''),
      intent: String(row.intent || ''),
      clicks: nonNegativeInteger(row.clicks),
      impressions: nonNegativeInteger(row.impressions),
      ctr: nonNegativeNumber(row.ctr),
      position: nullableNumber(row.position),
      citations: nonNegativeInteger(row.citations),
      cited_pages: nonNegativeInteger(row.citedPages),
      observed_window_start: normalizeDate(windowStart),
      observed_window_end: normalizeDate(windowEnd),
      synced_at: now,
      secret_hash: secretHash
    }));

    await supabaseRequest(
      'search_metric_rows?on_conflict=client_id,row_key',
      {
        method: 'POST',
        body: chunk,
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        env,
        fetchImpl
      }
    );
    written += chunk.length;
  }
  return written;
}

export async function readMetricRows(
  clientId,
  startDate,
  endDate,
  { env = process.env, fetchImpl = fetch } = {}
) {
  requireStore(env);
  const rows = [];
  let offset = 0;

  while (true) {
    const query =
      'search_metric_rows?client_id=eq.' + encodeURIComponent(clientId) +
      '&metric_date=gte.' + encodeURIComponent(startDate) +
      '&metric_date=lte.' + encodeURIComponent(endDate) +
      '&select=source,surface,metric_date,query,page,country,device,clicks,impressions,ctr,position,citations,cited_pages,topic,intent' +
      '&order=metric_date.asc' +
      '&limit=' + PAGE_SIZE +
      '&offset=' + offset;

    const page = await supabaseRequest(query, { env, fetchImpl });
    const batch = Array.isArray(page) ? page : [];
    rows.push(...batch.map((row) => ({
      source: row.source,
      surface: row.surface,
      date: row.metric_date,
      query: row.query,
      page: row.page,
      country: row.country,
      device: row.device,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      citations: row.citations,
      citedPages: row.cited_pages,
      topic: row.topic,
      intent: row.intent
    })));
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

export async function startSyncRun(
  {
    clientId,
    provider,
    surface = 'all',
    trigger = 'manual',
    idempotencyKey,
    windowStart = null,
    windowEnd = null
  },
  { env = process.env, fetchImpl = fetch } = {}
) {
  requireStore(env);
  const existing = await supabaseRequest(
    'search_sync_runs?client_id=eq.' + encodeURIComponent(clientId) +
      '&idempotency_key=eq.' + encodeURIComponent(idempotencyKey) +
      '&select=id,status,rows_written,started_at,finished_at&limit=1',
    { env, fetchImpl }
  );
  const row = Array.isArray(existing) ? existing[0] : null;
  if (row?.status === 'success') return { ...row, skipped: true };

  const secretHash = searchStoreSecretHash(env);
  const now = new Date().toISOString();

  if (row?.id) {
    const updated = await supabaseRequest(
      'search_sync_runs?id=eq.' + encodeURIComponent(row.id),
      {
        method: 'PATCH',
        body: {
          status: 'running',
          trigger,
          started_at: now,
          finished_at: null,
          rows_written: 0,
          error_code: null,
          error_message: null,
          secret_hash: secretHash
        },
        headers: { Prefer: 'return=representation' },
        env,
        fetchImpl
      }
    );
    return Array.isArray(updated) ? updated[0] : updated;
  }

  const created = await supabaseRequest('search_sync_runs', {
    method: 'POST',
    body: {
      client_id: clientId,
      provider,
      surface,
      trigger,
      status: 'running',
      idempotency_key: idempotencyKey,
      window_start: normalizeDate(windowStart),
      window_end: normalizeDate(windowEnd),
      secret_hash: secretHash
    },
    headers: { Prefer: 'return=representation' },
    env,
    fetchImpl
  });
  return Array.isArray(created) ? created[0] : created;
}

export async function finishSyncRun(
  runId,
  {
    status,
    rowsWritten = 0,
    errorCode = null,
    errorMessage = null
  },
  { env = process.env, fetchImpl = fetch } = {}
) {
  requireStore(env);
  const rows = await supabaseRequest(
    'search_sync_runs?id=eq.' + encodeURIComponent(runId),
    {
      method: 'PATCH',
      body: {
        status,
        rows_written: nonNegativeInteger(rowsWritten),
        finished_at: new Date().toISOString(),
        error_code: errorCode,
        error_message: errorMessage ? String(errorMessage).slice(0, 500) : null,
        secret_hash: searchStoreSecretHash(env)
      },
      headers: { Prefer: 'return=representation' },
      env,
      fetchImpl
    }
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function updateSyncState(
  {
    clientId,
    provider,
    surface = 'all',
    success,
    windowStart = null,
    windowEnd = null,
    errorCode = null,
    errorMessage = null
  },
  { env = process.env, fetchImpl = fetch } = {}
) {
  requireStore(env);
  const previous = await readSyncState(clientId, provider, surface, { env, fetchImpl });
  const now = new Date().toISOString();
  const body = {
    client_id: clientId,
    provider,
    surface,
    last_attempt_at: now,
    last_success_at: success ? now : (previous?.last_success_at || null),
    last_window_start: success ? normalizeDate(windowStart) : (previous?.last_window_start || null),
    last_window_end: success ? normalizeDate(windowEnd) : (previous?.last_window_end || null),
    consecutive_failures: success ? 0 : ((Number(previous?.consecutive_failures) || 0) + 1),
    last_error_code: success ? null : errorCode,
    last_error_message: success ? null : (errorMessage ? String(errorMessage).slice(0, 500) : null),
    secret_hash: searchStoreSecretHash(env),
    updated_at: now
  };

  const rows = await supabaseRequest(
    'search_sync_state?on_conflict=client_id,provider,surface',
    {
      method: 'POST',
      body,
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      env,
      fetchImpl
    }
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function readSyncState(
  clientId,
  provider,
  surface = 'all',
  { env = process.env, fetchImpl = fetch } = {}
) {
  requireStore(env);
  const rows = await supabaseRequest(
    'search_sync_state?client_id=eq.' + encodeURIComponent(clientId) +
      '&provider=eq.' + encodeURIComponent(provider) +
      '&surface=eq.' + encodeURIComponent(surface) +
      '&select=client_id,provider,surface,last_attempt_at,last_success_at,last_window_start,last_window_end,consecutive_failures,last_error_code,last_error_message,updated_at&limit=1',
    { env, fetchImpl }
  );
  return Array.isArray(rows) ? (rows[0] || null) : null;
}

export async function readAllSyncState(
  clientId,
  { env = process.env, fetchImpl = fetch } = {}
) {
  requireStore(env);
  const rows = await supabaseRequest(
    'search_sync_state?client_id=eq.' + encodeURIComponent(clientId) +
      '&select=client_id,provider,surface,last_attempt_at,last_success_at,last_window_start,last_window_end,consecutive_failures,last_error_code,last_error_message,updated_at&order=provider.asc,surface.asc',
    { env, fetchImpl }
  );
  return Array.isArray(rows) ? rows : [];
}

function metricRowKey(clientId, row) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify([
        clientId,
        row.source || '',
        row.surface || '',
        normalizeDate(row.date) || '',
        row.query || '',
        row.page || '',
        row.country || '',
        row.device || '',
        row.topic || '',
        row.intent || ''
      ])
    )
    .digest('hex');
}

async function supabaseRequest(
  path,
  {
    method = 'GET',
    body,
    headers = {},
    env = process.env,
    fetchImpl = fetch
  } = {}
) {
  requireStore(env);
  const root = String(env.RC_SUPABASE_URL || '').replace(/\/$/, '');
  const response = await fetchImpl(root + '/rest/v1/' + path, {
    method,
    headers: {
      apikey: String(env.RC_SUPABASE_PUBLISHABLE_KEY || '').trim(),
      'x-search-store-secret': String(env.SEARCH_STORE_SECRET || '').trim(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const error = new Error(
      'Search persistence request failed (' + response.status + ')' +
      (detail ? ': ' + detail.slice(0, 300) : '')
    );
    error.code = 'SEARCH_STORE_REQUEST_FAILED';
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function encryptionKey(env) {
  const value = String(env.SEARCH_TOKEN_ENCRYPTION_KEY || '').trim();
  if (!value) throw configError('SEARCH_TOKEN_ENCRYPTION_KEY is not configured.');
  const key = Buffer.from(value, 'base64url');
  if (key.length !== 32) throw configError('SEARCH_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  return key;
}

function requireStore(env) {
  if (!searchStoreConfigured(env)) {
    const error = configError('Search persistence is not fully configured.');
    error.code = 'SEARCH_STORE_NOT_CONFIGURED';
    throw error;
  }
}

function configError(message) {
  const error = new Error(message);
  error.code = 'SEARCH_CONFIG';
  return error;
}

function normalizeDate(value) {
  if (!value) return null;
  const text = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
