// Owner-only, read-only Publishing Center. No direct publish/discard actions here.
let rcPublishingRequestId = 0;
let rcPublishingLoaded = false;

function rcPublishingText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function rcPublishingDate(value) {
  if (!value) return 'Not published from this dashboard yet';
  const time = new Date(value);
  if (!Number.isFinite(time.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'Asia/Singapore', dateStyle: 'medium', timeStyle: 'short'
  }).format(time);
}

function rcPublishingCard(key, state) {
  const pill = document.querySelector('[data-pub-status="' + key + '"]');
  const detail = document.querySelector('[data-pub-detail="' + key + '"]');
  if (!pill || !detail) return;
  const connected = Boolean(state?.connected);
  const status = connected ? state.status : 'unavailable';
  pill.textContent = {live:'Live',draft:'Private Draft',current:'Matches live',unavailable:'Unavailable'}[status] || 'Unavailable';
  pill.dataset.state = status;

  if (!connected) {
    detail.textContent = 'Storage is unavailable. Do not assume anything has been saved or published.';
    return;
  }
  const versionText = Number.isInteger(state.publishedVersion)
    ? 'Live v' + state.publishedVersion + '. '
    : '';
  const updated = state.lastUpdatedAt ? ' Last saved ' + rcPublishingDate(state.lastUpdatedAt) + '.' : '';
  let schedule = '';
  if (key === 'photos' && state.schedule === 'pending') {
    schedule = ' A photo release is scheduled for ' + rcPublishingDate(state.scheduledPublishAt) + '. Manual publishing is blocked until it is cancelled.';
  } else if (key === 'photos' && state.schedule === 'active') {
    schedule = ' A scheduled photo version is currently live.'
      + (state.scheduledExpireAt ? ' It will revert on ' + rcPublishingDate(state.scheduledExpireAt) + '.' : ' It has no automatic expiry.');
  } else if (key === 'photos' && state.schedule === 'expired') {
    schedule = ' The scheduled release has ended; review or clear its record in Photos.';
  }
  detail.textContent = versionText + state.message + updated + schedule;
}

function rcPublishingRender(data) {
  const info = data?.overview || {};
  rcPublishingText('[data-pub-draft-count]', String(info.savedDraftsWaiting ?? '—'));
  rcPublishingText('[data-pub-connected]', String(info.connectedCount ?? '—'));
  rcPublishingText('[data-pub-checked]', data?.generatedAt ? rcPublishingDate(data.generatedAt) : '—');
  for (const key of ['websiteFacts','websiteDraft','photos','concierge']) rcPublishingCard(key, data?.[key]);
  const incomplete = !info.allConnected;
  rcPublishingText('[data-publishing-feedback]', incomplete
    ? 'Some editors are unavailable. Existing public content may still be visible, but do not assume unsaved changes were stored.'
    : 'Up to date. These statuses reflect saved server content, not edits still open in another browser tab. Refresh after saving or publishing.');
}

async function rcPublishingLoad() {
  const id = ++rcPublishingRequestId;
  rcPublishingText('[data-publishing-feedback]', 'Checking saved drafts and published content…');
  const refresh = document.querySelector('[data-publishing-refresh]');
  if (refresh) refresh.disabled = true;
  try {
    const response = await fetch('/api/admin/publishing-overview', {
      method: 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (id !== rcPublishingRequestId) return;
    if (!response.ok) throw new Error(response.status === 401
      ? 'Your owner session has expired. Sign in again to check publishing status.'
      : data.error || 'Publishing status could not be loaded.');
    rcPublishingRender(data);
    rcPublishingLoaded = true;
  } catch (error) {
    if (id !== rcPublishingRequestId) return;
    rcPublishingLoaded = false;
    rcPublishingRender(null);
    rcPublishingText('[data-publishing-feedback]', error?.message || 'Publishing status is unavailable. No action was taken.');
  } finally {
    if (id === rcPublishingRequestId && refresh) refresh.disabled = false;
  }
}

// Bind directly to existing original controls; no duplicated editor implementations.
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-publishing-refresh]')) {
    rcPublishingLoad();
    return;
  }
  const trigger = event.target.closest('[data-publishing-tab]');
  if (trigger) {
    const destination = String(trigger.dataset.publishingTab || '');
    const tab = [...document.querySelectorAll('[data-subnav] [data-tab]')]
      .find((button) => button.dataset.tab === destination);
    if (tab) tab.click();
  }
});

document.addEventListener('rc:admin-tab', (event) => {
  if (event.detail?.tab === 'publishing') rcPublishingLoad();
});
document.addEventListener('rc:admin-ready', () => {
  if (document.querySelector('[data-panel="publishing"]:not([hidden])')) rcPublishingLoad();
});
