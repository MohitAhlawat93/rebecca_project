const panel = document.querySelector('[data-panel="search"]');
const syncButton = document.querySelector('[data-search-sync]');
const importFile = document.querySelector('[data-search-import-file]');
const importButton = document.querySelector('[data-search-import]');

let state = null;
let loaded = false;
let loading = false;
let busy = false;
let importRows = null;

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value == null ? '—' : value;
}

function friendlyDate(value) {
  if (!value) return 'Not synced yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function compact(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return new Intl.NumberFormat('en', {
    notation: Math.abs(number) >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(number) >= 1000 ? 1 : 0
  }).format(number);
}

function percent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return new Intl.NumberFormat('en', {
    style: 'percent',
    maximumFractionDigits: 1
  }).format(number);
}

function delta(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback || 'vs previous period';
  if (number === 0) return 'No material change vs previous period';
  const sign = number > 0 ? '+' : '';
  return sign + percent(number) + ' vs previous period';
}

function targetLabel(value) {
  const text = String(value || '');
  try {
    const url = new URL(text);
    return url.pathname === '/' ? 'Homepage' : url.pathname;
  } catch {
    return text || '—';
  }
}

function metricMeta(item) {
  const bits = [];
  if (Number(item.clicks)) bits.push(compact(item.clicks) + ' clicks');
  if (Number(item.impressions)) bits.push(compact(item.impressions) + ' impressions');
  if (item.position != null) bits.push('avg position ' + Number(item.position).toFixed(1));
  if (Number(item.citations)) bits.push(compact(item.citations) + ' citations');
  return bits.join(' · ') || 'Measured search signal';
}

function setMessage(message, tone) {
  const holder = document.querySelector('[data-search-message]');
  if (!holder) return;
  holder.hidden = !message;
  holder.textContent = message || '';
  holder.className = 'rc-search-message' + (tone ? ' is-' + tone : '');
}

function providerView(provider) {
  const key = provider === 'google' ? 'googleStandard' : 'bingStandard';
  const status = state?.providerStatus?.[key] || {};
  const sync = (state?.persistence?.syncState || []).find(
    (item) => item.provider === provider && item.surface === 'all'
  );
  return { status, sync };
}

function renderProvider(provider) {
  const view = providerView(provider);
  const status = view.status;
  const sync = view.sync;
  const connection = status.state || 'needs-connection';

  let label = 'Not connected';
  let tone = 'is-neutral';
  if (connection === 'connected') {
    label = 'Connected';
    tone = 'is-good';
  } else if (connection === 'error' || connection === 'revoked') {
    label = connection === 'revoked' ? 'Reconnect' : 'Needs attention';
    tone = 'is-warn';
  }

  const statusElement = document.querySelector('[data-search-' + provider + '-status]');
  if (statusElement) {
    statusElement.textContent = label;
    statusElement.className = 'rc-search-status ' + tone;
  }

  const detail = document.querySelector('[data-search-' + provider + '-detail]');
  if (detail) {
    if (sync?.last_success_at) {
      detail.textContent =
        'Last successful sync ' + friendlyDate(sync.last_success_at) +
        (Number(sync.consecutive_failures) > 0
          ? ' · ' + sync.consecutive_failures + ' recent failure(s)'
          : '');
    } else if (connection === 'connected') {
      detail.textContent = 'Connected · first historical sync is pending.';
    } else if (status.lastErrorMessage) {
      detail.textContent = status.lastErrorMessage;
    } else {
      detail.textContent = 'One-time account connection is still required.';
    }
  }

  const button = document.querySelector('[data-search-connect="' + provider + '"]');
  if (button) {
    button.textContent =
      connection === 'connected'
        ? (status.durableRefreshConfigured ? 'Connected' : 'Reconnect')
        : 'Connect ' + (provider === 'google' ? 'Google' : 'Bing');
    button.disabled = connection === 'connected' && Boolean(status.durableRefreshConfigured);
  }
}

function render() {
  if (!state) return;

  renderProvider('google');
  renderProvider('bing');

  const current = state.comparison?.current || {};
  const changes = state.comparison?.delta || {};
  const hasData =
    Number(state.persistence?.currentRows || 0) > 0 ||
    Number(current.impressions || 0) > 0 ||
    Number(current.clicks || 0) > 0 ||
    Number(current.citations || 0) > 0;

  setText('[data-search-clicks]', hasData ? compact(current.clicks || 0) : '—');
  setText('[data-search-impressions]', hasData ? compact(current.impressions || 0) : '—');
  setText('[data-search-ctr]', hasData ? percent(current.ctr || 0) : '—');
  setText('[data-search-citations]', hasData ? compact(current.citations || 0) : '—');
  setText('[data-search-clicks-delta]', hasData ? delta(changes.clicks) : 'Waiting for measured data');
  setText('[data-search-impressions-delta]', hasData ? delta(changes.impressions) : 'Waiting for measured data');
  setText('[data-search-ctr-delta]', hasData ? delta(changes.ctr, 'Click-through rate') : 'Click-through rate');
  setText('[data-search-citations-delta]', hasData ? delta(changes.citations, 'AI citation signal') : 'Bing/AI export signals');

  const opportunities = document.querySelector('[data-search-opportunities]');
  if (opportunities) {
    opportunities.innerHTML = state.opportunities?.length
      ? state.opportunities.map((item) => {
          return '<article class="rc-search-opportunity is-' + esc(item.priority || 'low') + '">' +
            '<div class="rc-search-opportunity-head">' +
              '<span class="rc-search-priority">' + esc(item.priority || 'review') + '</span>' +
              '<strong>' + esc(item.title || 'Review search opportunity') + '</strong>' +
            '</div>' +
            '<p>' + esc(item.reason || '') + '</p>' +
            '<small>' + esc(targetLabel(item.target)) + ' · ' + esc(metricMeta(item.evidence || {})) + '</small>' +
          '</article>';
        }).join('')
      : '<div class="rc-empty">' +
          (hasData
            ? 'No evidence-backed search action needs attention in the current comparison window.'
            : 'Search recommendations will appear after Google/Bing data is connected and synced.') +
        '</div>';
  }

  const pages = document.querySelector('[data-search-pages]');
  if (pages) {
    pages.innerHTML = state.topPages?.length
      ? state.topPages.map((item) => {
          return '<article class="rc-search-row">' +
            '<div><strong>' + esc(targetLabel(item.key)) + '</strong><small>' + esc(metricMeta(item)) + '</small></div>' +
            '<span>' + (item.ctr != null ? esc(percent(item.ctr)) + ' CTR' : '') + '</span>' +
          '</article>';
        }).join('')
      : '<div class="rc-empty">No measured page data yet.</div>';
  }

  const queries = document.querySelector('[data-search-queries]');
  if (queries) {
    queries.innerHTML = state.topQueries?.length
      ? state.topQueries.map((item) => {
          return '<article class="rc-search-row">' +
            '<div><strong>' + esc(item.key) + '</strong><small>' + esc(metricMeta(item)) + '</small></div>' +
            '<span>' + (item.position != null ? '#' + esc(Number(item.position).toFixed(1)) : '') + '</span>' +
          '</article>';
        }).join('')
      : '<div class="rc-empty">No measured query data yet.</div>';
  }

  const surfaces = document.querySelector('[data-search-surfaces]');
  if (surfaces) {
    surfaces.innerHTML = state.surfaces?.length
      ? state.surfaces.map((item) => {
          return '<article class="rc-search-surface">' +
            '<span>' + esc(item.source || 'search') + '</span>' +
            '<strong>' + esc(String(item.surface || 'web').replaceAll('-', ' ')) + '</strong>' +
            '<small>' + esc(metricMeta(item)) + '</small>' +
          '</article>';
        }).join('')
      : '<div class="rc-empty">Search surfaces will appear after the first successful sync or supported report import.</div>';
  }
}

async function load(options = {}) {
  if (loading) return false;
  loading = true;
  if (!options.quiet) setMessage('Loading search intelligence…');
  try {
    const response = await fetch('/api/admin/search-intelligence?mode=persisted', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) return false;
    if (!response.ok) throw new Error(data.error || 'Could not load Search Intelligence.');
    state = data;
    loaded = true;
    render();
    setMessage('');
    return true;
  } catch (error) {
    loaded = false;
    setMessage(error?.message || 'Search Intelligence is unavailable.', 'error');
    return false;
  } finally {
    loading = false;
  }
}

async function connect(provider) {
  if (busy) return;
  busy = true;
  setMessage('Preparing ' + (provider === 'google' ? 'Google' : 'Bing') + ' connection…');
  try {
    const response = await fetch('/api/admin/search-connect?provider=' + encodeURIComponent(provider), {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const setup = Array.isArray(data.required) && data.required.length
        ? ' One-time technical setup is still needed before Rebecca can connect this account.'
        : '';
      throw new Error((data.error || 'Could not start the connection.') + setup);
    }
    if (!data.authorizationUrl) throw new Error('Provider connection URL was not returned.');
    window.location.assign(data.authorizationUrl);
  } catch (error) {
    setMessage(error?.message || 'Could not connect this provider.', 'error');
  } finally {
    busy = false;
  }
}

async function syncNow() {
  if (busy) return;
  busy = true;
  if (syncButton) {
    syncButton.disabled = true;
    syncButton.textContent = 'Syncing…';
  }
  setMessage('Syncing connected search providers…');

  try {
    const response = await fetch('/api/admin/search-sync', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Search sync could not complete.');

    const results = data.results || (data.provider ? [data] : []);
    const successCount = results.filter((item) => item.status === 'success').length;
    const skippedCount = results.filter((item) => item.status === 'skipped').length;

    if (successCount) {
      setMessage('Search sync completed. ' + successCount + ' provider(s) updated.', 'good');
    } else if (skippedCount) {
      setMessage('Nothing was synced yet. Connect Google/Bing first, then try again.');
    } else {
      setMessage('Search sync finished.');
    }

    loaded = false;
    await load({ quiet: true });
  } catch (error) {
    setMessage(error?.message || 'Search sync failed.', 'error');
  } finally {
    busy = false;
    if (syncButton) {
      syncButton.disabled = false;
      syncButton.textContent = 'Sync now';
    }
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const source = String(text || '').replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => String(value).trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => String(value).trim() !== '')) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((value) => String(value).trim());
  return rows.slice(1).map((values) => {
    const item = {};
    headers.forEach((header, index) => {
      const raw = values[index] == null ? '' : String(values[index]).trim();
      if (/^(clicks|impressions|citations|citedpages|count)$/i.test(header)) {
        item[header] = Number(raw.replaceAll(',', '')) || 0;
      } else if (/^(ctr|position|avgimpressionposition)$/i.test(header)) {
        const number = Number(raw.replace('%', ''));
        item[header] = Number.isFinite(number) ? number * (raw.includes('%') ? 0.01 : 1) : 0;
      } else {
        item[header] = raw;
      }
    });
    return item;
  });
}

async function readImport(file) {
  importRows = null;
  if (importButton) importButton.disabled = true;
  setText('[data-search-import-status]', file?.name || 'No report selected.');
  if (!file) return;

  try {
    if (file.size > 12 * 1024 * 1024) throw new Error('Search report is too large.');
    const text = await file.text();
    let rows;
    if (/\.json$/i.test(file.name) || String(file.type).includes('json')) {
      const parsed = JSON.parse(text);
      rows = Array.isArray(parsed) ? parsed : parsed?.rows;
    } else {
      rows = parseCsv(text);
    }
    if (!Array.isArray(rows) || !rows.length) throw new Error('No report rows were found.');
    if (rows.length > 50000) throw new Error('This report has more than 50,000 rows.');
    importRows = rows;
    if (importButton) importButton.disabled = false;
    setText('[data-search-import-status]', rows.length + ' report rows ready to import.');
  } catch (error) {
    setText('[data-search-import-status]', error?.message || 'Could not read that report.');
  }
}

async function importReport() {
  if (!importRows?.length || busy) return;
  const kind = document.querySelector('[data-search-import-kind]')?.value || 'google-generative-ai';
  busy = true;
  if (importButton) {
    importButton.disabled = true;
    importButton.textContent = 'Importing…';
  }

  try {
    const response = await fetch('/api/admin/search-import', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ kind, rows: importRows })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not import this search report.');

    setText(
      '[data-search-import-status]',
      data.status === 'skipped'
        ? 'This report was already imported.'
        : compact(data.rowsWritten || 0) + ' search rows stored.'
    );
    importRows = null;
    if (importFile) importFile.value = '';
    loaded = false;
    await load({ quiet: true });
  } catch (error) {
    setText('[data-search-import-status]', error?.message || 'Search report was not imported.');
  } finally {
    busy = false;
    if (importButton) {
      importButton.textContent = 'Import report';
      importButton.disabled = !importRows?.length;
    }
  }
}

function handleCallbackMessage() {
  const params = new URLSearchParams(window.location.search);
  const outcome = params.get('search');
  if (!outcome) return;

  const provider = params.get('provider');
  const providerLabel = provider === 'google' ? 'Google' : provider === 'bing' ? 'Bing' : 'Search provider';

  if (outcome === 'connected') {
    setMessage(providerLabel + ' connected successfully. Run Sync now to collect historical data.', 'good');
  } else if (outcome === 'connection-denied') {
    setMessage(providerLabel + ' connection was cancelled. Nothing changed.', 'error');
  } else if (outcome === 'connection-error') {
    setMessage(providerLabel + ' could not be connected. The existing website was not affected.', 'error');
  } else if (outcome === 'oauth-state-invalid') {
    setMessage('That connection request expired or could not be verified. Start the connection again.', 'error');
  }
}

document.addEventListener('click', (event) => {
  const refresh = event.target.closest('[data-search-refresh]');
  if (refresh) {
    loaded = false;
    load();
    return;
  }

  const connectButton = event.target.closest('[data-search-connect]');
  if (connectButton) {
    connect(connectButton.dataset.searchConnect);
    return;
  }

  if (event.target.closest('[data-search-sync]')) {
    syncNow();
    return;
  }

  if (event.target.closest('[data-search-import]')) {
    importReport();
  }
});

importFile?.addEventListener('change', (event) => {
  readImport(event.target.files?.[0]);
});

if (panel) {
  const observer = new MutationObserver(() => {
    if (!panel.hidden && !loaded) load();
  });
  observer.observe(panel, { attributes: true, attributeFilter: ['hidden', 'class'] });
}

window.addEventListener('DOMContentLoaded', () => {
  handleCallbackMessage();
  if (panel && !panel.hidden) load();
});
