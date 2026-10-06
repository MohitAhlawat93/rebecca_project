const loginView = document.querySelector('[data-login-view]');
const appView = document.querySelector('[data-app-view]');
const loginForm = document.querySelector('[data-login-form]');
const loginMessage = document.querySelector('[data-login-message]');
const logoutButton = document.querySelector('[data-logout]');
const saveButton = document.querySelector('[data-save]');
const saveState = document.querySelector('[data-save-state]');
const saveDetail = document.querySelector('[data-save-detail]');
const storeBanner = document.querySelector('[data-store-banner]');
const quickSavebar = document.querySelector('[data-quick-savebar]');
const mediaSaveButton = document.querySelector('[data-media-save-draft]');
const mediaPublishButton = document.querySelector('[data-media-publish]');
const mediaPreviewButton = document.querySelector('[data-media-preview]');
const mediaPlacementSelect = document.querySelector('[data-media-placement]');
const mediaFileInput = document.querySelector('[data-media-file]');
const mediaChoosePhoto = document.querySelector('[data-media-choose-photo]');
const mediaUploadButton = document.querySelector('[data-media-upload-button]');
const mediaUploadStatus = document.querySelector('[data-media-upload-status]');

let quickState = null;
let persistentStore = false;
let dirty = false;
let activeTab = 'availability';
let mediaState = null;
let mediaPublished = null;
let mediaPlacements = [];
let mediaHistory = [];
let mediaPersistent = false;
let mediaDirty = false;
let mediaDraftAhead = false;
let mediaLoaded = false;
let activeMediaPlacement = 'hero';

const STATUS_LABELS = {
  accepting: 'Accepting enquiries',
  limited: 'Limited availability',
  travelling: 'Travelling',
  away: 'Temporarily away',
  unavailable: 'Not accepting enquiries'
};

const STATUS_MESSAGES = {
  accepting: 'Currently accepting enquiries.',
  limited: 'Availability is limited, so early enquiries are appreciated.',
  travelling: 'Currently travelling. Please check the Travel page before enquiring.',
  away: 'Temporarily away. Replies may be slower than usual.',
  unavailable: 'Not currently accepting new enquiries.'
};

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = value ?? '—';
};

const csv = (value = '') => String(value).split(',').map((item) => item.trim()).filter(Boolean);

function friendlyDate(value) {
  if (!value) return 'Not saved here yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function setDirty(value = true) {
  dirty = value;
  if (!saveButton) return;
  saveButton.disabled = !persistentStore || !dirty;
  saveState.textContent = dirty ? 'Unsaved changes' : 'All changes saved';
  saveDetail.textContent = persistentStore
    ? (dirty ? 'Review, then use Save & apply.' : 'Website and concierge can use the current Quick Control state.')
    : 'Storage must be connected before changes can be applied.';
}

function showLogin(message = '') {
  loginView.hidden = false;
  appView.hidden = true;
  loginMessage.textContent = message;
}

function showApp(session) {
  loginView.hidden = true;
  appView.hidden = false;
  setText('[data-control-status]', session?.control?.status || 'Quick Control');
}

function activateTab(name) {
  activeTab = name;
  document.querySelectorAll('[data-tab]').forEach((button) => {
    const selected = button.dataset.tab === name;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    const selected = panel.dataset.panel === name;
    panel.hidden = !selected;
    panel.classList.toggle('is-active', selected);
  });
  if (quickSavebar) quickSavebar.hidden = name === 'media';
  if (name === 'media' && !mediaLoaded) loadMedia();
}

function renderAvailability() {
  if (!quickState) return;
  const current = quickState.availability || {};
  document.querySelectorAll('[data-status]').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.status === current.status);
  });
  const message = document.querySelector('[data-availability-message]');
  if (message) message.value = current.message || '';
  setText('[data-availability-summary]', current.label || STATUS_LABELS[current.status] || '—');
}

function travelCard(item, index) {
  return `
    <article class="rc-edit-card" data-trip-index="${index}">
      <div class="rc-edit-card-head">
        <div>
          <span class="rc-card-kicker">Trip ${index + 1}</span>
          <strong>${esc(item.title || 'New trip')}</strong>
        </div>
        <div class="rc-inline-actions">
          <label class="rc-toggle"><input type="checkbox" data-trip-visible ${item.visible !== false ? 'checked' : ''}><span>Visible</span></label>
          <button type="button" class="rc-danger-link" data-remove-trip>Remove</button>
        </div>
      </div>
      <div class="rc-form-grid">
        <label class="rc-field"><span>Headline</span><input data-trip="title" value="${esc(item.title || '')}" maxlength="180"></label>
        <label class="rc-field"><span>Date range</span><input data-trip="dateRange" value="${esc(item.dateRange || '')}" maxlength="140"></label>
        <label class="rc-field"><span>Cities <small>comma separated</small></span><input data-trip="cities" value="${esc((item.cities || []).join(', '))}"></label>
        <label class="rc-field rc-field-wide"><span>Public description</span><textarea data-trip="body" maxlength="800" rows="4">${esc(item.body || '')}</textarea></label>
        <label class="rc-field rc-field-wide"><span>Notes <small>comma separated</small></span><input data-trip="meta" value="${esc((item.meta || []).join(', '))}"></label>
      </div>
    </article>
  `;
}

function renderTravel() {
  const list = document.querySelector('[data-travel-list]');
  if (!list || !quickState) return;
  list.innerHTML = quickState.travel.length
    ? quickState.travel.map(travelCard).join('')
    : '<div class="rc-empty">No public travel windows. Use “Add trip” when you need one.</div>';
}

function rateCard(rate, index) {
  const amountValue = rate.amount == null ? '' : String(rate.amount);
  return `
    <article class="rc-rate-card" data-rate-index="${index}">
      <div class="rc-rate-main">
        <div>
          <span class="rc-card-kicker">${esc(rate.category || 'Rate')}</span>
          <strong>${esc(rate.label || rate.short || 'Rate')}</strong>
          <small>${esc(rate.note || '')}</small>
        </div>
        <label class="rc-money-field">
          <span>SGD</span>
          <input type="number" min="0" max="1000000" step="1" data-rate="amount" value="${esc(amountValue)}" placeholder="Bespoke">
        </label>
      </div>
      <div class="rc-rate-options">
        <label class="rc-toggle"><input type="checkbox" data-rate-visible ${rate.visible !== false ? 'checked' : ''}><span>Show publicly</span></label>
        <label class="rc-toggle"><input type="checkbox" data-rate-featured ${rate.featured ? 'checked' : ''}><span>Featured</span></label>
        <label class="rc-rate-note"><span>Note</span><input data-rate="note" value="${esc(rate.note || '')}" maxlength="180"></label>
      </div>
    </article>
  `;
}

function renderRates() {
  const list = document.querySelector('[data-rates-list]');
  if (!list || !quickState) return;
  list.innerHTML = quickState.rates.map(rateCard).join('');
}

function renderContact() {
  if (!quickState) return;
  document.querySelectorAll('[data-contact]').forEach((input) => {
    input.value = quickState.contact?.[input.dataset.contact] || '';
  });
}

function renderProfile() {
  if (!quickState) return;
  document.querySelectorAll('[data-profile]').forEach((input) => {
    const key = input.dataset.profile;
    input.value = key === 'languages'
      ? (quickState.profile?.languages || []).join(', ')
      : (quickState.profile?.[key] || '');
  });
}

function renderAll() {
  renderAvailability();
  renderTravel();
  renderRates();
  renderContact();
  renderProfile();
  activateTab(activeTab);
}

function collectTravel() {
  return [...document.querySelectorAll('[data-trip-index]')].map((card, index) => {
    const previous = quickState.travel[index] || {};
    const get = (name) => card.querySelector('[data-trip="' + name + '"]')?.value || '';
    return {
      ...previous,
      title: get('title').trim(),
      dateRange: get('dateRange').trim(),
      kicker: previous.kicker || '',
      cities: csv(get('cities')),
      body: get('body').trim(),
      meta: csv(get('meta')),
      visible: Boolean(card.querySelector('[data-trip-visible]')?.checked)
    };
  });
}

function collectRates() {
  return [...document.querySelectorAll('[data-rate-index]')].map((card, index) => {
    const previous = quickState.rates[index] || {};
    const amountRaw = card.querySelector('[data-rate="amount"]')?.value ?? '';
    return {
      ...previous,
      amount: amountRaw === '' ? null : Number(amountRaw),
      note: card.querySelector('[data-rate="note"]')?.value?.trim() || '',
      visible: Boolean(card.querySelector('[data-rate-visible]')?.checked),
      featured: Boolean(card.querySelector('[data-rate-featured]')?.checked)
    };
  });
}

function collectState() {
  const availabilityStatus = document.querySelector('[data-status].is-selected')?.dataset.status || quickState.availability.status;

  const profile = { ...quickState.profile };
  document.querySelectorAll('[data-profile]').forEach((input) => {
    const key = input.dataset.profile;
    profile[key] = key === 'languages' ? csv(input.value) : input.value.trim();
  });

  const contact = { ...quickState.contact };
  document.querySelectorAll('[data-contact]').forEach((input) => {
    contact[input.dataset.contact] = input.value.trim();
  });

  return {
    availability: {
      ...quickState.availability,
      status: availabilityStatus,
      label: STATUS_LABELS[availabilityStatus] || quickState.availability.label,
      message: document.querySelector('[data-availability-message]')?.value?.trim() || STATUS_MESSAGES[availabilityStatus],
      until: quickState.availability.until || null
    },
    travel: collectTravel(),
    rates: collectRates(),
    profile,
    contact
  };
}


function mediaPlacement() {
  return mediaPlacements.find((item) => item.key === activeMediaPlacement)
    || mediaPlacements[0]
    || { key: 'hero', label: 'Homepage rotation', max: 6 };
}

function mediaById(id) {
  return mediaState?.library?.find((item) => item.id === id) || null;
}

function mediaPreviewPath() {
  const paths = {
    hero: '/',
    aboutFeature: '/about',
    about: '/about',
    reviews: '/reviews',
    travel: '/travel',
    favouritesHero: '/favourites',
    favourites: '/favourites',
    journal: '/journal',
    press: '/press',
    galleryProfessional: '/gallery',
    galleryCandid: '/gallery',
    dateIdeas: '/date-ideas',
    etiquette: '/etiquette'
  };
  return paths[activeMediaPlacement] || '/';
}

function setMediaDirty(value = true) {
  mediaDirty = value;
  const canSave = mediaPersistent && mediaDirty;
  if (mediaSaveButton) mediaSaveButton.disabled = !canSave;
  if (mediaPublishButton) mediaPublishButton.disabled = !mediaPersistent || !(mediaDirty || mediaDraftAhead);
  renderMediaStatus();
}

function renderMediaStatus(meta = {}) {
  setText('[data-media-connection]', mediaPersistent ? 'Connected' : 'Unavailable');
  setText('[data-media-live-version]', mediaPersistent ? ('v' + (meta.publishedVersion ?? window.__rcMediaPublishedVersion ?? 0)) : 'Fallback');
  setText('[data-media-published-at]', friendlyDate(meta.publishedAt ?? window.__rcMediaPublishedAt));
  setText('[data-media-library-count]', mediaState?.library?.length ?? 0);

  const draftLabel = mediaDirty
    ? 'Unsaved changes'
    : mediaDraftAhead
      ? 'Saved draft'
      : 'Matches live';
  setText('[data-media-draft-status]', draftLabel);
  setText(
    '[data-media-draft-detail]',
    mediaDirty
      ? 'Save the draft before previewing or publishing.'
      : mediaDraftAhead
        ? 'Preview it privately, then publish when ready.'
        : 'No unpublished media changes.'
  );

  if (mediaSaveButton) mediaSaveButton.disabled = !mediaPersistent || !mediaDirty;
  if (mediaPublishButton) mediaPublishButton.disabled = !mediaPersistent || !(mediaDirty || mediaDraftAhead);
}

function renderMediaPlacementSelect() {
  if (!mediaPlacementSelect) return;
  mediaPlacementSelect.innerHTML = mediaPlacements.map((item) =>
    '<option value="' + esc(item.key) + '">' + esc(item.label) + '</option>'
  ).join('');
  mediaPlacementSelect.value = activeMediaPlacement;
  setText('[data-media-placement-label]', mediaPlacement().label);
}

function selectedMediaIds() {
  return mediaState?.placements?.[activeMediaPlacement] || [];
}

function renderMediaSelected() {
  const holder = document.querySelector('[data-media-selected]');
  if (!holder || !mediaState) return;

  const ids = selectedMediaIds();
  if (!ids.length) {
    holder.innerHTML = '<div class="rc-empty">No photos selected for this area. Choose from the library below.</div>';
    return;
  }

  holder.innerHTML = ids.map((id, index) => {
    const item = mediaById(id);
    if (!item) return '';
    return `
      <article class="rc-media-selected-card">
        <img src="${esc(item.url)}" alt="${esc(item.alt || 'Rebecca editorial portrait')}" loading="lazy">
        <div>
          <strong>${String(index + 1).padStart(2, '0')} · ${esc(item.name || 'Photo')}</strong>
          <small>${esc(item.source === 'upload' ? 'Uploaded' : 'Current library')}</small>
        </div>
        <div class="rc-media-order-actions">
          <button type="button" data-media-move="up" data-media-id="${esc(id)}" aria-label="Move photo earlier" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-media-move="down" data-media-id="${esc(id)}" aria-label="Move photo later" ${index === ids.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-media-toggle="${esc(id)}" class="rc-danger-link">Remove</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderMediaGrid() {
  const holder = document.querySelector('[data-media-grid]');
  if (!holder || !mediaState) return;

  const selected = new Set(selectedMediaIds());
  holder.innerHTML = mediaState.library.map((item) => {
    const isSelected = selected.has(item.id);
    return `
      <article class="rc-media-card ${isSelected ? 'is-selected' : ''}">
        <button type="button" class="rc-media-thumb" data-media-toggle="${esc(item.id)}" aria-pressed="${isSelected ? 'true' : 'false'}">
          <img src="${esc(item.url)}" alt="${esc(item.alt || 'Rebecca editorial portrait')}" loading="lazy">
          <span>${isSelected ? 'Selected ✓' : 'Use here +'}</span>
        </button>
        <div class="rc-media-card-copy">
          <div><strong>${esc(item.name || 'Photo')}</strong><small>${item.source === 'upload' ? 'Uploaded' : 'Current site'}</small></div>
          <label class="rc-field">
            <span>Alt text</span>
            <input value="${esc(item.alt || '')}" data-media-alt="${esc(item.id)}" maxlength="220">
          </label>
        </div>
      </article>
    `;
  }).join('');
}

function renderMediaHistory() {
  setText('[data-media-history-count]', mediaHistory.length);
  const holder = document.querySelector('[data-media-history]');
  if (!holder) return;
  if (!mediaHistory.length) {
    holder.innerHTML = '<div class="rc-empty">Published versions will appear here after the second publish.</div>';
    return;
  }

  holder.innerHTML = mediaHistory.map((entry) => `
    <article class="rc-history-row">
      <div>
        <strong>Published version ${esc(entry.version)}</strong>
        <small>${esc(friendlyDate(entry.publishedAt))}</small>
      </div>
      <button type="button" class="rc-secondary" data-media-restore="${esc(entry.version)}">Restore to draft</button>
    </article>
  `).join('');
}

function renderMedia() {
  if (!mediaState) return;
  renderMediaPlacementSelect();
  renderMediaSelected();
  renderMediaGrid();
  renderMediaHistory();
  renderMediaStatus();
}

async function loadMedia() {
  try {
    const response = await fetch('/api/admin/media', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      showLogin('Your owner session expired. Please sign in again.');
      return;
    }
    if (!response.ok) throw new Error(data.error || 'Could not load Media & Publish.');

    mediaState = data.draft;
    mediaPublished = data.published;
    mediaPlacements = data.placements || [];
    mediaHistory = data.history || [];
    mediaPersistent = Boolean(data.persistent && data.configured);
    mediaDraftAhead = Boolean(data.hasDraftChanges);
    mediaDirty = false;
    mediaLoaded = true;
    window.__rcMediaPublishedVersion = data.publishedVersion || 0;
    window.__rcMediaPublishedAt = data.publishedAt || null;
    renderMedia();
  } catch (error) {
    mediaPersistent = false;
    mediaLoaded = false;
    setText('[data-media-connection]', 'Unavailable');
    setText('[data-media-draft-status]', 'Could not load');
    setText('[data-media-draft-detail]', error?.message || 'Media storage is unavailable.');
  }
}

async function saveMediaDraft({ quiet = false } = {}) {
  if (!mediaPersistent || !mediaState) return false;
  if (!mediaDirty && !quiet) return true;

  if (mediaSaveButton) {
    mediaSaveButton.disabled = true;
    mediaSaveButton.textContent = 'Saving…';
  }

  try {
    const response = await fetch('/api/admin/media', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ state: mediaState })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not save the media draft.');

    mediaState = data.draft;
    mediaPublished = data.published;
    mediaHistory = data.history || [];
    mediaDraftAhead = Boolean(data.hasDraftChanges);
    mediaDirty = false;
    window.__rcMediaPublishedVersion = data.publishedVersion || 0;
    window.__rcMediaPublishedAt = data.publishedAt || null;
    renderMedia();
    return true;
  } catch (error) {
    mediaDirty = true;
    setText('[data-media-draft-status]', 'Not saved');
    setText('[data-media-draft-detail]', error?.message || 'Nothing was published.');
    return false;
  } finally {
    if (mediaSaveButton) mediaSaveButton.textContent = 'Save draft';
    setMediaDirty(mediaDirty);
  }
}

async function previewMediaDraft() {
  if (mediaDirty) {
    const saved = await saveMediaDraft();
    if (!saved) return;
  }
  const join = mediaPreviewPath().includes('?') ? '&' : '?';
  window.open(mediaPreviewPath() + join + 'rc_preview=1', '_blank', 'noopener');
}

async function publishMedia() {
  if (!mediaPersistent) return;
  if (mediaDirty) {
    const saved = await saveMediaDraft();
    if (!saved) return;
  }
  if (!mediaDraftAhead) return;
  if (!window.confirm('Publish these media changes to the live website now?')) return;

  mediaPublishButton.disabled = true;
  mediaPublishButton.textContent = 'Publishing…';

  try {
    const response = await fetch('/api/admin/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'publish' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not publish media.');

    mediaState = data.draft;
    mediaPublished = data.published;
    mediaHistory = data.history || [];
    mediaDraftAhead = Boolean(data.hasDraftChanges);
    mediaDirty = false;
    window.__rcMediaPublishedVersion = data.publishedVersion || 0;
    window.__rcMediaPublishedAt = data.publishedAt || null;
    renderMedia();
  } catch (error) {
    setText('[data-media-draft-status]', 'Publish failed');
    setText('[data-media-draft-detail]', error?.message || 'The live website was not changed.');
  } finally {
    mediaPublishButton.textContent = 'Publish to website';
    setMediaDirty(mediaDirty);
  }
}

async function restoreMedia(version) {
  if (!window.confirm('Restore this older published version to Draft? The live website will stay unchanged.')) return;
  try {
    const response = await fetch('/api/admin/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'restore', version })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not restore this version.');

    mediaState = data.draft;
    mediaHistory = data.history || [];
    mediaDraftAhead = true;
    mediaDirty = false;
    renderMedia();
  } catch (error) {
    setText('[data-media-draft-status]', 'Restore failed');
    setText('[data-media-draft-detail]', error?.message || 'Nothing was changed.');
  }
}

async function loadQuickControl() {
  try {
    const response = await fetch('/api/admin/quick-control', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });

    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      showLogin('Your owner session expired. Please sign in again.');
      return;
    }
    if (!response.ok) throw new Error(data.error || 'Could not load Quick Control.');

    quickState = data.state;
    persistentStore = Boolean(data.persistent && data.configured);

    setText('[data-store-mode]', persistentStore ? 'Connected' : 'Safe fallback');
    setText('[data-last-saved]', friendlyDate(data.updatedAt));
    storeBanner.hidden = persistentStore;

    renderAll();
    setDirty(false);
  } catch (error) {
    persistentStore = false;
    storeBanner.hidden = false;
    setText('[data-store-mode]', 'Unavailable');
    saveState.textContent = 'Editor unavailable';
    saveDetail.textContent = error?.message || 'Could not load Quick Control.';
    saveButton.disabled = true;
  }
}

async function loadSession() {
  try {
    const response = await fetch('/api/admin/session', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok && data.authenticated) {
      showApp(data);
      await loadQuickControl();
      return;
    }

    if (response.status === 503) {
      showLogin('Rebecca Control needs its private server configuration before sign-in can be used.');
      return;
    }

    showLogin();
  } catch {
    showLogin('Could not reach Rebecca Control. Please refresh and try again.');
  }
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = 'Signing in…';

  const submit = loginForm.querySelector('button[type="submit"]');
  const formData = new FormData(loginForm);
  const loginId = String(formData.get('loginId') || '').trim();
  const password = String(formData.get('password') || '');

  submit.disabled = true;

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ loginId, password })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      loginMessage.textContent = data.error || 'Sign-in failed.';
      return;
    }

    loginForm.reset();
    await loadSession();
  } catch {
    loginMessage.textContent = 'Could not sign in. Please try again.';
  } finally {
    submit.disabled = false;
  }
});

logoutButton?.addEventListener('click', async () => {
  logoutButton.disabled = true;
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });
  } finally {
    logoutButton.disabled = false;
    quickState = null;
    mediaState = null;
    mediaLoaded = false;
    showLogin('Signed out.');
  }
});

document.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    activateTab(tab.dataset.tab);
    return;
  }

  if (event.target.closest('[data-media-choose-photo]')) {
    mediaFileInput?.click();
    return;
  }

  const mediaToggle = event.target.closest('[data-media-toggle]');
  if (mediaToggle && mediaState) {
    const id = mediaToggle.dataset.mediaToggle;
    const placement = mediaPlacement();
    const list = mediaState.placements[activeMediaPlacement] || [];
    const index = list.indexOf(id);
    if (index >= 0) list.splice(index, 1);
    else if (list.length < placement.max) list.push(id);
    else {
      setText('[data-media-draft-detail]', 'This area can rotate up to ' + placement.max + ' photos.');
      return;
    }
    mediaState.placements[activeMediaPlacement] = list;
    setMediaDirty(true);
    renderMediaSelected();
    renderMediaGrid();
    return;
  }

  const mediaMove = event.target.closest('[data-media-move]');
  if (mediaMove && mediaState) {
    const id = mediaMove.dataset.mediaId;
    const list = mediaState.placements[activeMediaPlacement] || [];
    const index = list.indexOf(id);
    const target = mediaMove.dataset.mediaMove === 'up' ? index - 1 : index + 1;
    if (index >= 0 && target >= 0 && target < list.length) {
      [list[index], list[target]] = [list[target], list[index]];
      setMediaDirty(true);
      renderMediaSelected();
    }
    return;
  }

  const restore = event.target.closest('[data-media-restore]');
  if (restore) {
    restoreMedia(restore.dataset.mediaRestore);
    return;
  }

  const status = event.target.closest('[data-status]');
  if (status && quickState) {
    document.querySelectorAll('[data-status]').forEach((button) => button.classList.remove('is-selected'));
    status.classList.add('is-selected');
    quickState.availability.status = status.dataset.status;
    quickState.availability.label = STATUS_LABELS[status.dataset.status] || status.textContent.trim();
    quickState.availability.message = STATUS_MESSAGES[status.dataset.status] || quickState.availability.message;
    const messageInput = document.querySelector('[data-availability-message]');
    if (messageInput) messageInput.value = quickState.availability.message;
    setText('[data-availability-summary]', quickState.availability.label);
    setDirty(true);
    return;
  }

  if (event.target.closest('[data-add-trip]') && quickState) {
    const id = 'trip-' + Date.now();
    quickState.travel.push({
      id,
      kicker: '',
      dateRange: '',
      title: 'New trip',
      cities: [],
      body: '',
      meta: [],
      alt: false,
      visible: true
    });
    renderTravel();
    setDirty(true);
    return;
  }

  const remove = event.target.closest('[data-remove-trip]');
  if (remove && quickState) {
    const card = remove.closest('[data-trip-index]');
    const index = Number(card?.dataset.tripIndex);
    if (Number.isInteger(index) && window.confirm('Remove this public trip from Quick Control?')) {
      quickState.travel.splice(index, 1);
      renderTravel();
      setDirty(true);
    }
  }
});

document.addEventListener('input', (event) => {
  if (
    event.target.matches('[data-availability-message], [data-trip], [data-rate], [data-contact], [data-profile]')
  ) {
    setDirty(true);
  }

  if (event.target.matches('[data-media-alt]') && mediaState) {
    const item = mediaById(event.target.dataset.mediaAlt);
    if (item) {
      item.alt = event.target.value;
      setMediaDirty(true);
    }
  }
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-trip-visible], [data-rate-visible], [data-rate-featured]')) {
    setDirty(true);
  }

  if (event.target.matches('[data-media-placement]')) {
    activeMediaPlacement = event.target.value;
    renderMediaPlacementSelect();
    renderMediaSelected();
    renderMediaGrid();
  }

  if (event.target.matches('[data-media-file]')) {
    const file = event.target.files?.[0];
    if (mediaUploadButton) mediaUploadButton.hidden = !file;
    if (mediaUploadStatus) mediaUploadStatus.textContent = file ? file.name : '';
  }
});

saveButton?.addEventListener('click', async () => {
  if (!persistentStore || !quickState || !dirty) return;

  saveButton.disabled = true;
  saveButton.textContent = 'Saving…';
  saveState.textContent = 'Saving changes';
  saveDetail.textContent = 'Keeping website and concierge data together.';

  try {
    const nextState = collectState();
    const response = await fetch('/api/admin/quick-control', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ state: nextState })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not save these changes.');

    quickState = data.state;
    setText('[data-last-saved]', friendlyDate(data.updatedAt));
    renderAll();
    setDirty(false);
  } catch (error) {
    setDirty(true);
    saveState.textContent = 'Not saved';
    saveDetail.textContent = error?.message || 'Nothing was changed publicly.';
  } finally {
    saveButton.textContent = 'Save & apply';
    saveButton.disabled = !persistentStore || !dirty;
  }
});

mediaSaveButton?.addEventListener('click', () => saveMediaDraft());
mediaPreviewButton?.addEventListener('click', previewMediaDraft);
mediaPublishButton?.addEventListener('click', publishMedia);

document.addEventListener('rc:media-uploaded', async (event) => {
  if (!mediaState || !event.detail?.url) return;
  const id = 'upload-' + (crypto.randomUUID?.() || Date.now().toString(36));
  const item = {
    id,
    url: event.detail.url,
    pathname: event.detail.pathname || null,
    name: event.detail.name || 'Uploaded photo',
    alt: 'Rebecca editorial portrait',
    source: 'upload',
    createdAt: new Date().toISOString()
  };
  mediaState.library.unshift(item);

  const placement = mediaPlacement();
  const list = mediaState.placements[activeMediaPlacement] || [];
  if (list.length < placement.max) list.push(id);
  mediaState.placements[activeMediaPlacement] = list;

  setMediaDirty(true);
  renderMedia();
  await saveMediaDraft({ quiet: true });
});

window.addEventListener('beforeunload', (event) => {
  if (!dirty && !mediaDirty) return;
  event.preventDefault();
  event.returnValue = '';
});

loadSession();
