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
const mediaScheduleButton = document.querySelector('[data-media-schedule]');
const mediaSchedulePublishInput = document.querySelector('[data-media-schedule-publish]');
const mediaScheduleExpireInput = document.querySelector('[data-media-schedule-expire]');
const mediaScheduleCancelButton = document.querySelector('[data-media-cancel-schedule]');
const mediaScheduleCommitButton = document.querySelector('[data-media-commit-schedule]');
const mediaSchedulePreviewButton = document.querySelector('[data-media-preview-scheduled]');
const conciergeSaveButton = document.querySelector('[data-concierge-save]');
const conciergePublishButton = document.querySelector('[data-concierge-publish]');
const conciergeDiscardButton = document.querySelector('[data-concierge-discard]');
const conciergeTestForm = document.querySelector('[data-concierge-test-form]');
const conciergeTestInput = document.querySelector('[data-concierge-test-input]');
const conciergeTestPage = document.querySelector('[data-concierge-test-page]');
const conciergeTestThread = document.querySelector('[data-concierge-test-thread]');
const conciergeTestSend = document.querySelector('[data-concierge-test-send]');
const assistantPrompt = document.querySelector('[data-assistant-prompt]');
const assistantProposeButton = document.querySelector('[data-assistant-propose]');
const assistantResults = document.querySelector('[data-assistant-results]');
const assistantProposalList = document.querySelector('[data-assistant-proposal-list]');
const assistantUnsupported = document.querySelector('[data-assistant-unsupported]');
const systemImportFile = document.querySelector('[data-system-import-file]');
const systemImportButton = document.querySelector('[data-system-import]');
const systemStatus = document.querySelector('[data-system-status]');
const insightsActions = document.querySelector('[data-insights-actions]');
const settingsSaveButton = document.querySelector('[data-settings-save]');

const startupParams = new URLSearchParams(window.location.search);
const requestedTab = startupParams.get('tab');
const requestedPlacement = startupParams.get('placement');
const visualReturn = startupParams.get('visualReturn');

let quickState = null;
let scheduleState = null;
let persistentStore = false;
let dirty = false;
let activeTab = requestedTab || 'availability';
let mediaState = null;
let mediaPublished = null;
let mediaPlacements = [];
let mediaHistory = [];
let mediaPersistent = false;
let mediaDirty = false;
let mediaDraftAhead = false;
let mediaSchedule = null;
let mediaSchedulePhase = 'none';
let mediaLoaded = false;
let activeMediaPlacement = requestedPlacement || 'hero';
let conciergeState = null;
let conciergePublished = null;
let conciergeHistory = [];
let conciergePersistent = false;
let conciergeDirty = false;
let conciergeDraftAhead = false;
let conciergeLoaded = false;
let conciergePublishedVersion = 0;
let conciergePublishedAt = null;
let conciergeTestHistory = [];
let needsItems = [];
let needsSummary = { open: 0, drafted: 0, closed: 0, recurring: 0, total: 0 };
let needsPersistent = false;
let needsLoaded = false;
let needsFilter = 'open';
let assistantProposal = null;
let assistantBusy = false;
let systemEvents = [];
let systemSnapshots = [];
let systemLoaded = false;
let systemPersistent = false;
let systemImportBundle = null;
let insightsState = null;
let insightsLoaded = false;
let settingsState = {
  dashboardStartTab:'insights',
  aiAssistantEnabled:true,
  needsRebeccaCaptureEnabled:true,
  automaticRecoveryEnabled:true
};
let settingsDirty = false;

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

function friendlyDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return value || '—';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function friendlySingaporeDateTime(value) {
  if (!value) return '—';
  const normalized = String(value).includes('T') && !/[zZ]|[+-]\d\d:\d\d$/.test(String(value))
    ? String(value) + ':00+08:00'
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Singapore',
    timeZoneName: 'short'
  }).format(date);
}

function singaporeNowLocalInput() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

function availabilityExpirySummary() {
  const until = document.querySelector('[data-availability-until]')?.value || '';
  const revertStatus = document.querySelector('[data-availability-revert]')?.value || 'accepting';
  if (!until) return 'Permanent until you add an expiry date.';
  return `Stays active through ${friendlyDateKey(until)}. On the next Singapore day it returns to ${STATUS_LABELS[revertStatus] || 'Accepting enquiries'}.`;
}

function updateAvailabilityExpirySummary() {
  setText('[data-availability-expiry-summary]', availabilityExpirySummary());
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
  if (quickSavebar) quickSavebar.hidden = ['insights','assistant','media','concierge','concierge-test','needs-rebecca','history','export','settings'].includes(name);
  if (name === 'media' && !mediaLoaded) loadMedia();
  if ((name === 'concierge' || name === 'concierge-test') && !conciergeLoaded) loadConcierge();
  if (name === 'needs-rebecca' && !needsLoaded) loadNeedsRebecca();
  if ((name === 'history' || name === 'export' || name === 'settings') && !systemLoaded) loadSystem();
  if (name === 'insights' && !insightsLoaded) loadInsights();
}

function renderAvailability() {
  if (!quickState) return;
  const current = quickState.availability || {};
  document.querySelectorAll('[data-status]').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.status === current.status);
  });
  const message = document.querySelector('[data-availability-message]');
  if (message) message.value = current.message || '';
  const until = document.querySelector('[data-availability-until]');
  if (until) until.value = current.until || '';
  const revert = document.querySelector('[data-availability-revert]');
  if (revert) revert.value = current.revertStatus || 'accepting';
  setText('[data-availability-summary]', current.label || STATUS_LABELS[current.status] || '—');
  updateAvailabilityExpirySummary();
}

function travelCard(item, index) {
  const lifecycle = item.lifecycle || 'manual';
  const lifecycleLabel = {
    upcoming: 'Upcoming',
    current: 'Current',
    past: 'Past',
    manual: 'Manual'
  }[lifecycle] || 'Manual';
  const lifecycleNote = lifecycle === 'past'
    ? 'Automatically hidden from the public Travel page.'
    : lifecycle === 'current'
      ? 'This trip is currently active.'
      : lifecycle === 'upcoming'
        ? 'This trip will become Current automatically.'
        : 'Add both start and end dates to automate this trip.';

  return `
    <article class="rc-edit-card rc-trip-card is-${esc(lifecycle)}" data-trip-index="${index}">
      <div class="rc-edit-card-head">
        <div>
          <span class="rc-card-kicker">Trip ${index + 1}</span>
          <strong>${esc(item.title || 'New trip')}</strong>
          <small class="rc-lifecycle-note">${esc(lifecycleNote)}</small>
        </div>
        <div class="rc-inline-actions">
          <span class="rc-lifecycle-pill is-${esc(lifecycle)}">${esc(lifecycleLabel)}</span>
          <label class="rc-toggle"><input type="checkbox" data-trip-visible ${item.visible !== false ? 'checked' : ''}><span>Visible</span></label>
          <button type="button" class="rc-danger-link" data-remove-trip>Remove</button>
        </div>
      </div>
      <div class="rc-form-grid">
        <label class="rc-field"><span>Headline</span><input data-trip="title" value="${esc(item.title || '')}" maxlength="180"></label>
        <label class="rc-field"><span>Public date wording</span><input data-trip="dateRange" value="${esc(item.dateRange || '')}" maxlength="140"></label>
        <label class="rc-field"><span>Starts <small>automatic</small></span><input type="date" data-trip="startDate" value="${esc(item.startDate || '')}"></label>
        <label class="rc-field"><span>Ends <small>automatic</small></span><input type="date" data-trip="endDate" value="${esc(item.endDate || '')}"></label>
        <label class="rc-field rc-field-wide"><span>Cities <small>comma separated</small></span><input data-trip="cities" value="${esc((item.cities || []).join(', '))}"></label>
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

function scheduleEventCard(event, mode = 'next') {
  const icon = event.kind?.startsWith('travel') ? '✈' : '↻';
  return `
    <article class="rc-schedule-event is-${esc(mode)}">
      <div class="rc-schedule-date">
        <strong>${esc(friendlyDateKey(event.date))}</strong>
        <span>${esc(icon)}</span>
      </div>
      <div>
        <strong>${esc(event.title || 'Automatic change')}</strong>
        <p>${esc(event.detail || '')}</p>
      </div>
    </article>
  `;
}

function renderSchedule() {
  const schedule = scheduleState || {};
  const counts = schedule.travelCounts || {};
  setText('[data-schedule-timezone]', schedule.timeZone || 'Asia/Singapore');
  setText('[data-schedule-today]', friendlyDateKey(schedule.today));
  setText('[data-schedule-current-count]', counts.current || 0);
  setText('[data-schedule-upcoming-count]', counts.upcoming || 0);
  setText('[data-schedule-past-count]', counts.past || 0);

  const next = document.querySelector('[data-schedule-next]');
  if (next) {
    next.innerHTML = (schedule.nextChanges || []).length
      ? schedule.nextChanges.map((event) => scheduleEventCard(event, 'next')).join('')
      : '<div class="rc-empty">Nothing is scheduled to change automatically yet.</div>';
  }

  const applied = document.querySelector('[data-schedule-applied]');
  const appliedChanges = schedule.appliedChanges || [];
  setText('[data-schedule-applied-count]', appliedChanges.length);
  if (applied) {
    applied.innerHTML = appliedChanges.length
      ? appliedChanges.slice(0, 12).map((event) => scheduleEventCard(event, 'applied')).join('')
      : '<div class="rc-empty">No automatic changes have taken effect yet.</div>';
  }
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
  renderSchedule();
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
      startDate: get('startDate') || null,
      endDate: get('endDate') || null,
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
      until: document.querySelector('[data-availability-until]')?.value || null,
      revertStatus: document.querySelector('[data-availability-revert]')?.value || 'accepting',
      revertMessage: ''
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

function mediaScheduleBlocksManualPublish() {
  return mediaSchedulePhase === 'pending' || mediaSchedulePhase === 'active';
}

function hasMediaSchedule() {
  return Boolean(mediaSchedule);
}

function setMediaDirty(value = true) {
  mediaDirty = value;
  const canSave = mediaPersistent && mediaDirty;
  if (mediaSaveButton) mediaSaveButton.disabled = !canSave;
  if (mediaPublishButton) {
    mediaPublishButton.disabled = !mediaPersistent
      || !(mediaDirty || mediaDraftAhead)
      || mediaScheduleBlocksManualPublish();
  }
  if (mediaScheduleButton) {
    mediaScheduleButton.disabled = !mediaPersistent
      || mediaDirty
      || !mediaDraftAhead
      || mediaScheduleBlocksManualPublish();
  }
  renderMediaStatus();
  renderMediaSchedule();
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
  if (mediaPublishButton) {
    mediaPublishButton.disabled = !mediaPersistent
      || !(mediaDirty || mediaDraftAhead)
      || mediaScheduleBlocksManualPublish();
  }
}

function renderMediaSchedule() {
  const phase = mediaSchedulePhase || 'none';
  const phaseLabel = {
    none: 'Not scheduled',
    pending: 'Scheduled',
    active: 'Live now',
    expired: 'Finished'
  }[phase] || 'Not scheduled';

  const pill = document.querySelector('[data-media-schedule-phase]');
  if (pill) {
    pill.textContent = phaseLabel;
    pill.className = 'rc-lifecycle-pill ' + (
      phase === 'pending' ? 'is-upcoming'
        : phase === 'active' ? 'is-current'
          : phase === 'expired' ? 'is-past'
            : 'is-manual'
    );
  }

  if (mediaSchedulePublishInput) {
    mediaSchedulePublishInput.min = singaporeNowLocalInput();
    mediaSchedulePublishInput.disabled = hasMediaSchedule();
    if (mediaSchedule?.publishLocal) mediaSchedulePublishInput.value = mediaSchedule.publishLocal;
  }

  if (mediaScheduleExpireInput) {
    mediaScheduleExpireInput.min = mediaSchedulePublishInput?.value || singaporeNowLocalInput();
    mediaScheduleExpireInput.disabled = hasMediaSchedule();
    if (mediaSchedule?.expireLocal) mediaScheduleExpireInput.value = mediaSchedule.expireLocal;
  }

  let summary = mediaDirty
    ? 'Save the Draft before scheduling it.'
    : mediaDraftAhead
      ? 'Choose a future Singapore time. Expiry is optional.'
      : 'Create a Draft that differs from the live website before scheduling it.';

  if (mediaSchedule) {
    if (phase === 'pending') {
      summary = 'Locked snapshot publishes ' + friendlySingaporeDateTime(mediaSchedule.publishLocal)
        + (mediaSchedule.expireLocal
          ? ' and reverts to the previous live version ' + friendlySingaporeDateTime(mediaSchedule.expireLocal) + '.'
          : '. It stays live until you publish something else.');
    } else if (phase === 'active') {
      summary = 'The scheduled snapshot is live now.'
        + (mediaSchedule.expireLocal
          ? ' It automatically reverts ' + friendlySingaporeDateTime(mediaSchedule.expireLocal) + '.'
          : ' It remains live until you publish something else.');
    } else if (phase === 'expired') {
      summary = 'This schedule has finished and the previous live version is being shown again. Clear the schedule when you no longer need its record.';
    }
  }

  setText('[data-media-schedule-summary]', summary);

  if (mediaSchedulePreviewButton) mediaSchedulePreviewButton.hidden = !mediaSchedule;
  if (mediaScheduleCancelButton) mediaScheduleCancelButton.hidden = !mediaSchedule;
  if (mediaScheduleCommitButton) mediaScheduleCommitButton.hidden = phase !== 'active';
  if (mediaScheduleButton) {
    mediaScheduleButton.hidden = hasMediaSchedule();
    mediaScheduleButton.disabled = !mediaPersistent || mediaDirty || !mediaDraftAhead || hasMediaSchedule();
  }
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
  renderMediaSchedule();
}




function renderAssistantProposal() {
  if (!assistantResults || !assistantProposalList) return;
  const proposal = assistantProposal?.proposal || null;
  const changes = proposal?.changes || [];

  assistantResults.hidden = false;
  setText('[data-assistant-summary]', proposal?.summary || 'Review before applying');

  if (!changes.length) {
    assistantProposalList.innerHTML = '<div class="rc-empty">No safe supported Draft change was prepared. Refine the request and try again.</div>';
  } else {
    assistantProposalList.innerHTML = changes.map((change, index) => `
      <article class="rc-assistant-card${change.target === 'concierge' ? ' is-concierge' : ''}" data-assistant-change-index="${index}">
        <div class="rc-assistant-card-main">
          <div class="rc-assistant-card-head">
            <span class="rc-assistant-target">${change.target === 'concierge' ? 'Concierge Draft' : 'Website Draft'}</span>
            <span class="rc-card-kicker">Proposal ${index + 1}</span>
          </div>
          <h4>${esc(change.summary || 'Proposed Draft change')}</h4>
          <div class="rc-assistant-diff">
            <div><span>Before</span><p>${esc(change.before || 'Not set')}</p></div>
            <b class="rc-assistant-arrow" aria-hidden="true">→</b>
            <div><span>Proposed</span><p>${esc(change.after || '—')}</p></div>
          </div>
        </div>
        <div class="rc-assistant-card-actions">
          <button type="button" class="rc-primary" data-assistant-apply="${index}">Apply to Draft</button>
          <small>Nothing goes live.</small>
        </div>
      </article>
    `).join('');
  }

  const unsupported = proposal?.unsupported || '';
  if (assistantUnsupported) {
    assistantUnsupported.hidden = !unsupported;
    assistantUnsupported.textContent = unsupported;
  }
}

async function prepareAssistantProposal() {
  const prompt = String(assistantPrompt?.value || '').trim();
  if (!prompt || assistantBusy) return;

  assistantBusy = true;
  assistantProposal = null;
  if (assistantResults) assistantResults.hidden = true;
  if (assistantProposeButton) {
    assistantProposeButton.disabled = true;
    assistantProposeButton.textContent = 'Preparing…';
  }
  setText('[data-assistant-status]', 'Reading the current private Drafts and preparing a proposal. Nothing is being changed.');

  try {
    const response = await fetch('/api/admin/assistant-propose', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      showLogin('Your owner session expired. Please sign in again.');
      return;
    }
    if (!response.ok) throw new Error(data.error || 'Could not prepare a safe proposal.');

    assistantProposal = data;
    renderAssistantProposal();
    setText('[data-assistant-status]', (data.proposal?.changes?.length || 0)
      ? 'Proposal ready. Review every Before → Proposed change before applying.'
      : 'No Draft change was prepared. Nothing changed.');
  } catch (error) {
    setText('[data-assistant-status]', error?.message || 'Could not prepare a proposal. Nothing changed.');
  } finally {
    assistantBusy = false;
    if (assistantProposeButton) {
      assistantProposeButton.disabled = false;
      assistantProposeButton.textContent = 'Prepare Proposal';
    }
  }
}

async function applyAssistantProposal(index) {
  const change = assistantProposal?.proposal?.changes?.[index];
  const card = document.querySelector('[data-assistant-change-index="' + index + '"]');
  const button = card?.querySelector('[data-assistant-apply]');
  if (!change || !card || !button || button.disabled) return;

  button.disabled = true;
  button.textContent = 'Applying…';

  try {
    const response = await fetch('/api/admin/assistant-apply', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ change })
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      showLogin('Your owner session expired. Please sign in again.');
      return;
    }
    if (!response.ok) {
      if (data.stale) {
        card.classList.add('is-stale');
        button.textContent = 'Proposal stale';
        setText('[data-assistant-status]', data.error || 'The Draft changed. Generate a fresh proposal.');
        return;
      }
      throw new Error(data.error || 'Could not apply this proposal.');
    }

    card.classList.add('is-applied');
    button.textContent = 'Applied to ' + (data.target === 'concierge' ? 'Concierge Draft' : 'Website Draft');
    setText('[data-assistant-status]', data.message || 'Applied to Draft only. Nothing was published.');

    if (data.target === 'concierge') conciergeLoaded = false;
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Apply to Draft';
    setText('[data-assistant-status]', error?.message || 'Could not apply that proposal. Nothing was published.');
  }
}

function needsStatusLabel(status) {
  return {
    open: 'Open',
    drafted: 'Answer drafted',
    resolved: 'Resolved',
    ignored: 'Ignored'
  }[status] || 'Open';
}

function renderNeedsRebecca() {
  setText('[data-needs-connection]', needsPersistent ? 'Connected' : 'Safe fallback');
  setText('[data-needs-open-count]', String(needsSummary.open || 0));
  setText('[data-needs-recurring-count]', String(needsSummary.recurring || 0));
  setText('[data-needs-drafted-count]', String(needsSummary.drafted || 0));

  document.querySelectorAll('[data-needs-filter]').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.needsFilter === needsFilter);
  });

  const holder = document.querySelector('[data-needs-list]');
  if (!holder) return;

  const filtered = needsItems.filter((item) => {
    if (needsFilter === 'all') return true;
    if (needsFilter === 'closed') return ['resolved', 'ignored'].includes(item.status);
    return ['open', 'drafted'].includes(item.status);
  });

  if (!filtered.length) {
    holder.innerHTML = '<div class="rc-empty">' +
      (needsFilter === 'closed'
        ? 'No closed questions.'
        : needsFilter === 'all'
          ? 'No Needs Rebecca questions yet.'
          : 'Nothing needs Rebecca right now.') +
      '</div>';
    return;
  }

  holder.innerHTML = filtered.map((item) => {
    const recurring = Number(item.count) > 1;
    const meta = [
      item.page && item.page !== '/' ? 'Asked from ' + item.page : 'Asked from homepage',
      'Last seen ' + friendlyDate(item.lastSeen)
    ].join(' · ');

    let actions = '';
    if (item.status === 'open') {
      actions = `
        <button type="button" class="rc-primary" data-needs-draft-answer="${esc(item.id)}">Draft Answer</button>
        <button type="button" class="rc-secondary" data-needs-status-id="${esc(item.id)}" data-needs-status-value="resolved">Resolve</button>
        <button type="button" class="rc-secondary" data-needs-status-id="${esc(item.id)}" data-needs-status-value="ignored">Ignore</button>
      `;
    } else if (item.status === 'drafted') {
      actions = `
        <button type="button" class="rc-primary" data-needs-draft-answer="${esc(item.id)}">Open Answer Draft</button>
        <button type="button" class="rc-secondary" data-needs-status-id="${esc(item.id)}" data-needs-status-value="resolved">Resolve</button>
        <button type="button" class="rc-secondary" data-needs-status-id="${esc(item.id)}" data-needs-status-value="ignored">Ignore</button>
      `;
    } else {
      actions = `
        <button type="button" class="rc-secondary" data-needs-status-id="${esc(item.id)}" data-needs-status-value="open">Reopen</button>
        <button type="button" class="rc-danger-link" data-needs-delete="${esc(item.id)}">Delete</button>
      `;
    }

    return `
      <article class="rc-needs-card">
        <div class="rc-needs-card-main">
          <div class="rc-needs-card-meta">
            <span class="rc-needs-pill is-${esc(item.status)}">${esc(needsStatusLabel(item.status))}</span>
            <span class="rc-needs-pill">${recurring ? esc(item.count) + ' asks' : 'Asked once'}</span>
            ${recurring ? '<span class="rc-needs-pill is-open">Recurring</span>' : ''}
          </div>
          <h4>${esc(item.question)}</h4>
          <small>${esc(meta)}</small>
        </div>
        <div class="rc-needs-actions">${actions}</div>
      </article>
    `;
  }).join('');
}

function applyNeedsPayload(data) {
  needsItems = data.items || [];
  needsSummary = data.summary || { open: 0, drafted: 0, closed: 0, recurring: 0, total: needsItems.length };
  needsPersistent = Boolean(data.persistent);
  needsLoaded = true;
  renderNeedsRebecca();
}

async function loadNeedsRebecca() {
  try {
    const response = await fetch('/api/admin/needs-rebecca', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      showLogin('Your owner session expired. Please sign in again.');
      return false;
    }
    if (!response.ok) throw new Error(data.error || 'Could not load Needs Rebecca.');
    applyNeedsPayload(data);
    return true;
  } catch (error) {
    needsPersistent = false;
    needsLoaded = false;
    setText('[data-needs-connection]', 'Unavailable');
    const holder = document.querySelector('[data-needs-list]');
    if (holder) holder.innerHTML = '<div class="rc-empty">' + esc(error?.message || 'Needs Rebecca is unavailable.') + '</div>';
    return false;
  }
}

async function needsAction(payload, { quiet = false } = {}) {
  try {
    const response = await fetch('/api/admin/needs-rebecca', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not update Needs Rebecca.');
    applyNeedsPayload(data);
    return true;
  } catch (error) {
    if (!quiet) {
      const holder = document.querySelector('[data-needs-list]');
      if (holder) holder.insertAdjacentHTML('afterbegin', '<div class="rc-empty">' + esc(error?.message || 'Could not update Needs Rebecca.') + '</div>');
    }
    return false;
  }
}

async function draftNeedsRebeccaAnswer(id) {
  const item = needsItems.find((entry) => entry.id === id);
  if (!item) return;

  if (!conciergeLoaded) {
    const loaded = await loadConcierge();
    if (!loaded) return;
  }

  const answerId = 'needs-' + item.id;
  conciergeState.trustedAnswers = conciergeState.trustedAnswers || [];
  let index = conciergeState.trustedAnswers.findIndex((entry) => entry.id === answerId);

  if (index < 0) {
    conciergeState.trustedAnswers.push({
      id: answerId,
      question: item.question,
      answer: '',
      keywords: [],
      linkPath: '',
      linkLabel: '',
      enabled: true
    });
    index = conciergeState.trustedAnswers.length - 1;
    renderConcierge();
    setConciergeDirty(true);
  }

  await needsAction({ action: 'status', id: item.id, status: 'drafted' }, { quiet: true });
  activateTab('concierge');
  setText('[data-concierge-save-state]', 'Trusted Answer started from Needs Rebecca');
  setText('[data-concierge-save-detail]', 'Write Rebecca’s public answer, Save Draft, test it, then publish.');

  window.setTimeout(() => {
    const card = document.querySelector('[data-concierge-answer-index="' + index + '"]');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.querySelector('[data-concierge-answer-field="answer"]')?.focus();
  }, 80);
}

async function resolveNeedsFromPublishedAnswers(answers = []) {
  const ids = (answers || [])
    .map((item) => String(item?.id || ''))
    .filter((id) => id.startsWith('needs-'))
    .map((id) => id.slice(6));

  if (!ids.length) return;
  if (!needsLoaded) await loadNeedsRebecca();

  for (const id of ids) {
    const item = needsItems.find((entry) => entry.id === id);
    if (item && ['open', 'drafted'].includes(item.status)) {
      await needsAction({ action: 'status', id, status: 'resolved' }, { quiet: true });
    }
  }
}

function setConciergeDirty(value = true) {
  conciergeDirty = value;
  if (conciergeSaveButton) conciergeSaveButton.disabled = !conciergePersistent || !conciergeDirty;
  if (conciergeDiscardButton) conciergeDiscardButton.disabled = !conciergePersistent || (!conciergeDirty && !conciergeDraftAhead);
  if (conciergePublishButton) conciergePublishButton.disabled = !conciergePersistent || (!conciergeDirty && !conciergeDraftAhead);

  setText('[data-concierge-save-state]', conciergeDirty
    ? 'Unsaved AI Control edits'
    : (conciergeDraftAhead ? 'Draft ready to test or publish' : 'No Concierge changes'));
  setText('[data-concierge-save-detail]', conciergeDirty
    ? 'Save Draft before testing or publishing.'
    : (conciergeDraftAhead ? 'Visitors still see the previous published version.' : 'Draft and live version match.'));
}

function conciergeAnswerCard(item, index) {
  return `
    <article class="rc-concierge-answer" data-concierge-answer-index="${index}">
      <div class="rc-concierge-answer-head">
        <div>
          <span class="rc-card-kicker">Trusted answer ${index + 1}</span>
          <strong>${esc(item.question || 'New public question')}</strong>
          <small>Used only when the visitor’s wording matches this question or its keywords.</small>
        </div>
        <div class="rc-inline-actions">
          <label class="rc-toggle"><input type="checkbox" data-concierge-answer-enabled ${item.enabled !== false ? 'checked' : ''}><span>Enabled</span></label>
          <button type="button" class="rc-danger-link" data-concierge-remove-answer>Remove</button>
        </div>
      </div>
      <div class="rc-form-grid">
        <label class="rc-field rc-field-wide"><span>Question visitors may ask</span><input data-concierge-answer-field="question" value="${esc(item.question || '')}" maxlength="220" placeholder="e.g. How quickly does Rebecca usually reply?"></label>
        <label class="rc-field rc-field-wide"><span>Rebecca-approved answer</span><textarea data-concierge-answer-field="answer" maxlength="1200" rows="4" placeholder="Public answer only.">${esc(item.answer || '')}</textarea></label>
        <label class="rc-field rc-field-wide"><span>Matching words or phrases <small>comma separated</small></span><input data-concierge-answer-field="keywords" value="${esc((item.keywords || []).join(', '))}" maxlength="500" placeholder="reply time, response time, how fast"></label>
        <label class="rc-field"><span>Optional website path</span><input data-concierge-answer-field="linkPath" value="${esc(item.linkPath || '')}" maxlength="160" placeholder="/contact"></label>
        <label class="rc-field"><span>Optional button label</span><input data-concierge-answer-field="linkLabel" value="${esc(item.linkLabel || '')}" maxlength="80" placeholder="Contact Rebecca"></label>
      </div>
    </article>
  `;
}

function collectConciergeState() {
  if (!conciergeState) return null;
  const next = JSON.parse(JSON.stringify(conciergeState));

  document.querySelectorAll('[data-concierge-field]').forEach((input) => {
    next[input.dataset.conciergeField] = input.value;
  });

  const selectedStatus = document.querySelector('[data-concierge-status].is-selected')?.dataset.conciergeStatus;
  next.enabled = selectedStatus !== 'paused';

  next.trustedAnswers = [...document.querySelectorAll('[data-concierge-answer-index]')].map((card) => {
    const index = Number(card.dataset.conciergeAnswerIndex);
    const base = conciergeState.trustedAnswers?.[index] || {};
    const value = (name) => card.querySelector('[data-concierge-answer-field="' + name + '"]')?.value || '';
    return {
      ...base,
      question: value('question'),
      answer: value('answer'),
      keywords: csv(value('keywords')),
      linkPath: value('linkPath'),
      linkLabel: value('linkLabel'),
      enabled: Boolean(card.querySelector('[data-concierge-answer-enabled]')?.checked)
    };
  });

  return next;
}

function renderConciergeHistory() {
  setText('[data-concierge-history-count]', String(conciergeHistory.length));
  const holder = document.querySelector('[data-concierge-history]');
  if (!holder) return;
  if (!conciergeHistory.length) {
    holder.innerHTML = '<div class="rc-empty">Published versions will appear here after the second Concierge publish.</div>';
    return;
  }
  holder.innerHTML = conciergeHistory.map((entry) => `
    <article class="rc-history-row">
      <div>
        <strong>Published version ${esc(entry.version)}</strong>
        <small>${esc(friendlyDate(entry.publishedAt))}</small>
      </div>
      <button type="button" class="rc-secondary" data-concierge-restore="${esc(entry.version)}">Restore to Draft</button>
    </article>
  `).join('');
}

function renderConcierge() {
  if (!conciergeState) return;

  document.querySelectorAll('[data-concierge-status]').forEach((button) => {
    const live = button.dataset.conciergeStatus === 'live';
    button.classList.toggle('is-selected', live === (conciergeState.enabled !== false));
  });

  document.querySelectorAll('[data-concierge-field]').forEach((input) => {
    input.value = conciergeState[input.dataset.conciergeField] || '';
  });

  const answers = document.querySelector('[data-concierge-answers]');
  if (answers) {
    answers.innerHTML = conciergeState.trustedAnswers?.length
      ? conciergeState.trustedAnswers.map(conciergeAnswerCard).join('')
      : '<div class="rc-empty">No custom Trusted Answers yet. The concierge still uses Rebecca’s website data and existing safety rules.</div>';
  }

  setText('[data-concierge-connection]', conciergePersistent ? 'Connected' : 'Safe fallback');
  setText('[data-concierge-live-version]', 'v' + conciergePublishedVersion);
  setText('[data-concierge-published-at]', conciergePublishedAt ? friendlyDate(conciergePublishedAt) : 'Bundled defaults');
  setText('[data-concierge-answer-count]', String((conciergeState.trustedAnswers || []).filter((item) => item.enabled !== false).length));
  setText('[data-concierge-draft-status]', conciergeDirty ? 'Unsaved edits' : (conciergeDraftAhead ? 'Ahead of live' : 'Matches live'));
  setText('[data-concierge-draft-detail]', conciergeDirty
    ? 'Save Draft before testing.'
    : (conciergeDraftAhead ? 'Test privately, then publish when ready.' : 'No unpublished Concierge changes.'));

  renderConciergeHistory();
  setConciergeDirty(conciergeDirty);
}

async function loadConcierge() {
  try {
    const response = await fetch('/api/admin/concierge-control', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      showLogin('Your owner session expired. Please sign in again.');
      return false;
    }
    if (!response.ok) throw new Error(data.error || 'Could not load Concierge Control.');

    conciergeState = data.draft;
    conciergePublished = data.published;
    conciergeHistory = data.history || [];
    conciergePersistent = Boolean(data.persistent && data.configured);
    conciergeDraftAhead = Boolean(data.hasDraftChanges);
    conciergePublishedVersion = Number(data.publishedVersion) || 0;
    conciergePublishedAt = data.publishedAt || null;
    conciergeDirty = false;
    conciergeLoaded = true;
    renderConcierge();
    return true;
  } catch (error) {
    conciergePersistent = false;
    conciergeLoaded = false;
    setText('[data-concierge-connection]', 'Unavailable');
    setText('[data-concierge-draft-status]', 'Could not load');
    setText('[data-concierge-draft-detail]', error?.message || 'Concierge Control is unavailable.');
    return false;
  }
}

async function saveConciergeDraft({ quiet = false } = {}) {
  if (!conciergePersistent || !conciergeState) return false;
  if (!conciergeDirty && !quiet) return true;

  const nextState = collectConciergeState();
  if (!nextState) return false;

  if (conciergeSaveButton) {
    conciergeSaveButton.disabled = true;
    conciergeSaveButton.textContent = 'Saving…';
  }

  try {
    const response = await fetch('/api/admin/concierge-control', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ state: nextState })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not save the Concierge Draft.');

    conciergeState = data.draft;
    conciergePublished = data.published;
    conciergeHistory = data.history || [];
    conciergeDraftAhead = Boolean(data.hasDraftChanges);
    conciergePublishedVersion = Number(data.publishedVersion) || 0;
    conciergePublishedAt = data.publishedAt || null;
    conciergeDirty = false;
    renderConcierge();
    return true;
  } catch (error) {
    setText('[data-concierge-save-state]', 'Draft not saved');
    setText('[data-concierge-save-detail]', error?.message || 'Nothing changed publicly.');
    return false;
  } finally {
    if (conciergeSaveButton) conciergeSaveButton.textContent = 'Save Draft';
    setConciergeDirty(conciergeDirty);
  }
}

async function publishConcierge() {
  if (!conciergePersistent) return;
  if (conciergeDirty) {
    const saved = await saveConciergeDraft({ quiet: true });
    if (!saved) return;
  }
  if (!conciergeDraftAhead) return;
  if (!window.confirm('Publish this Concierge Draft to visitors now?')) return;

  if (conciergePublishButton) {
    conciergePublishButton.disabled = true;
    conciergePublishButton.textContent = 'Publishing…';
  }

  try {
    const response = await fetch('/api/admin/concierge-control', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'publish' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not publish Concierge Control.');

    conciergeState = data.draft;
    conciergePublished = data.published;
    conciergeHistory = data.history || [];
    conciergeDraftAhead = false;
    conciergePublishedVersion = Number(data.publishedVersion) || conciergePublishedVersion + 1;
    conciergePublishedAt = data.publishedAt || new Date().toISOString();
    conciergeDirty = false;
    renderConcierge();
    await resolveNeedsFromPublishedAnswers(data.published?.trustedAnswers || []);
    setText('[data-concierge-save-state]', 'Concierge published');
    setText('[data-concierge-save-detail]', 'Visitors now use this version.');
  } catch (error) {
    setText('[data-concierge-save-state]', 'Not published');
    setText('[data-concierge-save-detail]', error?.message || 'The live Concierge was not changed.');
  } finally {
    if (conciergePublishButton) conciergePublishButton.textContent = 'Publish Concierge';
    setConciergeDirty(conciergeDirty);
  }
}

async function discardConcierge() {
  if (!conciergePersistent || (!conciergeDirty && !conciergeDraftAhead)) return;
  if (!window.confirm('Discard the Concierge Draft and return to the current live version?')) return;

  try {
    const response = await fetch('/api/admin/concierge-control', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'discard' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not discard the Concierge Draft.');

    conciergeState = data.draft;
    conciergePublished = data.published;
    conciergeHistory = data.history || [];
    conciergeDraftAhead = false;
    conciergeDirty = false;
    renderConcierge();
  } catch (error) {
    setText('[data-concierge-save-state]', 'Draft not discarded');
    setText('[data-concierge-save-detail]', error?.message || 'Try again.');
  }
}

async function restoreConcierge(version) {
  if (!conciergePersistent) return;
  try {
    const response = await fetch('/api/admin/concierge-control', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'restore', version })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not restore that Concierge version.');

    conciergeState = data.draft;
    conciergePublished = data.published;
    conciergeHistory = data.history || [];
    conciergeDraftAhead = Boolean(data.hasDraftChanges);
    conciergeDirty = false;
    renderConcierge();
    activateTab('concierge');
    setText('[data-concierge-save-state]', 'Old version restored to Draft');
    setText('[data-concierge-save-detail]', 'Test it before publishing.');
  } catch (error) {
    setText('[data-concierge-save-state]', 'Restore failed');
    setText('[data-concierge-save-detail]', error?.message || 'Try again.');
  }
}

function addConciergeTestMessage(role, text, meta = '') {
  if (!conciergeTestThread) return;
  const item = document.createElement('div');
  item.className = 'rc-test-message ' + role;
  const who = role === 'user' ? 'Test visitor' : 'Rebecca’s Desk · Draft';
  item.innerHTML = '<span>' + esc(who) + '</span><p>' + esc(text) + '</p>' +
    (meta ? '<small>' + esc(meta) + '</small>' : '');
  conciergeTestThread.appendChild(item);
  conciergeTestThread.scrollTop = conciergeTestThread.scrollHeight;
  return item;
}

async function runConciergeTest(message) {
  const q = String(message || '').trim();
  if (!q) return;

  if (!conciergeLoaded) {
    const loaded = await loadConcierge();
    if (!loaded) return;
  }
  if (conciergeDirty) {
    const saved = await saveConciergeDraft({ quiet: true });
    if (!saved) {
      setText('[data-concierge-test-note]', 'Could not save the Draft, so the test was not run.');
      return;
    }
  }

  addConciergeTestMessage('user', q);
  conciergeTestHistory.push({ role: 'user', content: q });
  const pending = addConciergeTestMessage('assistant', 'Testing the saved Draft…');

  if (conciergeTestSend) {
    conciergeTestSend.disabled = true;
    conciergeTestSend.textContent = 'Testing…';
  }

  try {
    const response = await fetch('/api/admin/concierge-test', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        message: q,
        page: conciergeTestPage?.value || '/',
        history: conciergeTestHistory.slice(0, -1)
      })
    });
    const data = await response.json().catch(() => ({}));
    pending?.remove();
    if (!response.ok) throw new Error(data.error || 'Could not test the Concierge Draft.');

    addConciergeTestMessage('assistant', data.answer || 'No answer returned.', data.mode || 'draft');
    conciergeTestHistory.push({ role: 'assistant', content: data.answer || '' });
    conciergeTestHistory = conciergeTestHistory.slice(-8);
    setText('[data-concierge-test-note]', data.needsRebecca
      ? 'This answer is a candidate for the future “Needs Rebecca” inbox.'
      : 'Draft test completed. Nothing was published.');
  } catch (error) {
    pending?.remove();
    addConciergeTestMessage('assistant', error?.message || 'Test failed.', 'error');
    setText('[data-concierge-test-note]', 'Nothing was published.');
  } finally {
    if (conciergeTestSend) {
      conciergeTestSend.disabled = false;
      conciergeTestSend.textContent = 'Ask Draft';
    }
    if (conciergeTestInput) conciergeTestInput.value = '';
  }
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
    if (!mediaPlacements.some((item) => item.key === activeMediaPlacement)) {
      activeMediaPlacement = mediaPlacements[0]?.key || 'hero';
    }
    mediaHistory = data.history || [];
    mediaSchedule = data.schedule || null;
    mediaSchedulePhase = data.schedulePhase || 'none';
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
    mediaSchedule = data.schedule || null;
    mediaSchedulePhase = data.schedulePhase || mediaSchedulePhase;
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
    mediaSchedule = data.schedule || null;
    mediaSchedulePhase = data.schedulePhase || 'none';
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

async function previewScheduledMedia() {
  if (!mediaSchedule) return;
  const join = mediaPreviewPath().includes('?') ? '&' : '?';
  window.open(mediaPreviewPath() + join + 'rc_preview=scheduled', '_blank', 'noopener');
}

async function scheduleMediaPublish() {
  if (!mediaPersistent || mediaDirty || !mediaDraftAhead || mediaScheduleBlocksManualPublish()) return;
  const publishLocal = mediaSchedulePublishInput?.value || '';
  const expireLocal = mediaScheduleExpireInput?.value || '';

  if (!publishLocal) {
    setText('[data-media-schedule-summary]', 'Choose a future Singapore publish date and time.');
    return;
  }

  const message = expireLocal
    ? 'Schedule this saved media Draft for ' + friendlySingaporeDateTime(publishLocal)
      + ' and automatically revert ' + friendlySingaporeDateTime(expireLocal) + '?'
    : 'Schedule this saved media Draft for ' + friendlySingaporeDateTime(publishLocal) + '?';
  if (!window.confirm(message)) return;

  mediaScheduleButton.disabled = true;
  mediaScheduleButton.textContent = 'Scheduling…';

  try {
    const response = await fetch('/api/admin/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        action: 'schedule',
        publishLocal,
        expireLocal: expireLocal || null
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not schedule this media Draft.');

    mediaState = data.draft;
    mediaPublished = data.published;
    mediaHistory = data.history || [];
    mediaSchedule = data.schedule || null;
    mediaSchedulePhase = data.schedulePhase || 'pending';
    mediaDraftAhead = Boolean(data.hasDraftChanges);
    mediaDirty = false;
    renderMedia();
  } catch (error) {
    setText('[data-media-schedule-summary]', error?.message || 'Nothing was scheduled.');
  } finally {
    mediaScheduleButton.textContent = 'Schedule saved draft';
    setMediaDirty(mediaDirty);
  }
}

async function cancelScheduledMedia() {
  if (!mediaSchedule) return;
  const warning = mediaSchedulePhase === 'active'
    ? 'Cancel this active schedule? The website will immediately return to the version that was live before the schedule started.'
    : 'Cancel this scheduled publish? The live website will stay unchanged.';
  if (!window.confirm(warning)) return;

  mediaScheduleCancelButton.disabled = true;
  mediaScheduleCancelButton.textContent = 'Cancelling…';

  try {
    const response = await fetch('/api/admin/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'cancel_schedule' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not cancel this schedule.');

    mediaState = data.draft;
    mediaPublished = data.published;
    mediaHistory = data.history || [];
    mediaSchedule = null;
    mediaSchedulePhase = 'none';
    mediaDraftAhead = Boolean(data.hasDraftChanges);
    mediaDirty = false;
    if (mediaSchedulePublishInput) mediaSchedulePublishInput.value = '';
    if (mediaScheduleExpireInput) mediaScheduleExpireInput.value = '';
    renderMedia();
  } catch (error) {
    setText('[data-media-schedule-summary]', error?.message || 'Schedule was not cancelled.');
  } finally {
    mediaScheduleCancelButton.disabled = false;
    mediaScheduleCancelButton.textContent = 'Cancel schedule';
    setMediaDirty(mediaDirty);
  }
}

async function commitScheduledMedia() {
  if (!mediaSchedule || mediaSchedulePhase !== 'active') return;
  if (!window.confirm('Keep the currently live scheduled version permanently? Any automatic expiry will be removed.')) return;

  mediaScheduleCommitButton.disabled = true;
  mediaScheduleCommitButton.textContent = 'Keeping live…';

  try {
    const response = await fetch('/api/admin/media', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'commit_schedule' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not keep this scheduled version live.');

    mediaState = data.draft;
    mediaPublished = data.published;
    mediaHistory = data.history || [];
    mediaSchedule = null;
    mediaSchedulePhase = 'none';
    mediaDraftAhead = Boolean(data.hasDraftChanges);
    mediaDirty = false;
    window.__rcMediaPublishedVersion = data.publishedVersion || 0;
    window.__rcMediaPublishedAt = data.publishedAt || null;
    if (mediaSchedulePublishInput) mediaSchedulePublishInput.value = '';
    if (mediaScheduleExpireInput) mediaScheduleExpireInput.value = '';
    renderMedia();
  } catch (error) {
    setText('[data-media-schedule-summary]', error?.message || 'The scheduled version was not changed.');
  } finally {
    mediaScheduleCommitButton.disabled = false;
    mediaScheduleCommitButton.textContent = 'Keep live permanently';
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

    quickState = data.effectiveState || data.state;
    scheduleState = data.schedule || null;
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



function renderInsights() {
  const data = insightsState;
  if (!data) return;
  setText('[data-insights-open]', String(data.health?.openNeeds || 0));
  setText('[data-insights-recurring]', String(data.health?.recurringNeeds || 0));
  setText('[data-insights-upcoming]', String(data.health?.upcomingAutomaticChanges || 0));
  setText('[data-insights-recovery]', String(data.health?.recoveryPoints || 0));
  setText('[data-insights-privacy]', data.privacy || 'Operational insights only.');

  const actions = document.querySelector('[data-insights-actions]');
  if (actions) {
    actions.innerHTML = data.attention?.length
      ? data.attention.map((item) => `
        <button type="button" class="rc-insights-action is-${esc(item.level || 'info')}" data-insights-tab="${esc(item.tab || 'insights')}">
          <span class="rc-insights-level" aria-hidden="true"></span>
          <span><strong>${esc(item.title)}</strong><p>${esc(item.detail || '')}</p></span>
          <span aria-hidden="true">→</span>
        </button>
      `).join('')
      : '<div class="rc-empty">Nothing urgent needs attention right now.</div>';
  }

  const questions = document.querySelector('[data-insights-questions]');
  if (questions) {
    questions.innerHTML = data.recurringQuestions?.length
      ? data.recurringQuestions.map((item) => `
        <article class="rc-insights-item">
          <strong>${esc(item.question)}</strong>
          <small>Asked ${esc(item.count)} times · ${esc(item.page === '/' ? 'Homepage' : item.page)}</small>
        </article>
      `).join('')
      : '<div class="rc-empty">No recurring unanswered questions.</div>';
  }

  const schedule = document.querySelector('[data-insights-schedule]');
  if (schedule) {
    schedule.innerHTML = data.upcoming?.length
      ? data.upcoming.map((item) => `
        <article class="rc-insights-item">
          <strong>${esc(item.title)}</strong>
          <small>${esc(item.date)}${item.detail ? ' · ' + esc(item.detail) : ''}</small>
        </article>
      `).join('')
      : '<div class="rc-empty">No automatic changes are currently queued.</div>';
  }

  const activity = document.querySelector('[data-insights-activity]');
  if (activity) {
    activity.innerHTML = data.recentActivity?.length
      ? data.recentActivity.map((item) => `
        <article class="rc-insights-item">
          <strong>${esc(item.summary)}</strong>
          <small>${esc(item.area)} · ${esc(friendlyDate(item.at))}</small>
        </article>
      `).join('')
      : '<div class="rc-empty">No recent Rebecca Control activity yet.</div>';
  }
}

async function loadInsights() {
  try {
    const response = await fetch('/api/admin/insights', {
      method:'GET', credentials:'same-origin', cache:'no-store',
      headers:{Accept:'application/json'}
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      showLogin('Your owner session expired. Please sign in again.');
      return false;
    }
    if (!response.ok) throw new Error(data.error || 'Could not load Insights.');
    insightsState = data;
    insightsLoaded = true;
    renderInsights();
    return true;
  } catch (error) {
    insightsLoaded = false;
    const holder = document.querySelector('[data-insights-actions]');
    if (holder) holder.innerHTML = '<div class="rc-empty">' + esc(error?.message || 'Insights are unavailable.') + '</div>';
    return false;
  }
}

function renderSettings() {
  const select = document.querySelector('[data-setting="dashboardStartTab"]');
  if (select) select.value = settingsState.dashboardStartTab || 'insights';
  document.querySelectorAll('[data-setting-toggle]').forEach((input) => {
    input.checked = settingsState[input.dataset.settingToggle] !== false;
  });
  if (settingsSaveButton) settingsSaveButton.disabled = !settingsDirty;
  setText('[data-settings-status]', settingsDirty ? 'Unsaved changes' : 'Settings saved');
}

function collectSettings() {
  const next = {...settingsState};
  const select = document.querySelector('[data-setting="dashboardStartTab"]');
  if (select) next.dashboardStartTab = select.value;
  document.querySelectorAll('[data-setting-toggle]').forEach((input) => {
    next[input.dataset.settingToggle] = Boolean(input.checked);
  });
  return next;
}

async function saveSettings() {
  if (!settingsDirty) return;
  if (settingsSaveButton) {
    settingsSaveButton.disabled = true;
    settingsSaveButton.textContent = 'Saving…';
  }
  try {
    const data = await systemPost({action:'saveSettings', settings:collectSettings()});
    settingsState = data.settings || settingsState;
    systemEvents = data.events || systemEvents;
    settingsDirty = false;
    renderSettings();
    renderSystem();
    setText('[data-settings-status]', 'Settings saved');
  } catch (error) {
    setText('[data-settings-status]', error?.message || 'Settings were not saved.');
    settingsDirty = true;
  } finally {
    if (settingsSaveButton) {
      settingsSaveButton.textContent = 'Save settings';
      settingsSaveButton.disabled = !settingsDirty;
    }
  }
}

function renderSystem() {
  setText('[data-system-event-count]', String(systemEvents.length));
  setText('[data-system-snapshot-count]', String(systemSnapshots.length));
  setText('[data-system-connection]', systemPersistent ? 'Connected' : 'Unavailable');

  const snapshots = document.querySelector('[data-system-snapshots]');
  if (snapshots) {
    snapshots.innerHTML = systemSnapshots.length
      ? systemSnapshots.map((item) => `
        <article class="rc-system-row">
          <div class="rc-system-row-main">
            <div class="rc-system-row-meta">
              <span>Recovery point</span>
              <span>${esc(friendlyDate(item.at))}</span>
            </div>
            <strong>${esc(item.label || 'Recovery point')}</strong>
            <small>Restore copies this older live configuration into Website, Concierge and Media Drafts only.</small>
          </div>
          <button type="button" class="rc-secondary" data-system-restore="${esc(item.id)}">Restore to Draft</button>
        </article>
      `).join('')
      : '<div class="rc-empty">No recovery points yet. Rebecca Control will create them automatically before important publishes.</div>';
  }

  const events = document.querySelector('[data-system-events]');
  if (events) {
    events.innerHTML = systemEvents.length
      ? systemEvents.map((item) => `
        <article class="rc-system-row">
          <div class="rc-system-row-main">
            <div class="rc-system-row-meta">
              <span>${esc(item.area || 'System')}</span>
              <span>${esc(item.type || 'update')}</span>
            </div>
            <strong>${esc(item.summary)}</strong>
            <small>${esc(friendlyDate(item.at))} · ${esc(item.source || 'Rebecca Control')}</small>
          </div>
        </article>
      `).join('')
      : '<div class="rc-empty">No History events yet.</div>';
  }
}

async function loadSystem() {
  try {
    const response = await fetch('/api/admin/system', {
      method:'GET', credentials:'same-origin', cache:'no-store',
      headers:{Accept:'application/json'}
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      showLogin('Your owner session expired. Please sign in again.');
      return false;
    }
    if (!response.ok) throw new Error(data.error || 'Could not load History & Recovery.');
    systemEvents = data.events || [];
    systemSnapshots = data.snapshots || [];
    settingsState = data.settings || settingsState;
    systemPersistent = Boolean(data.persistent);
    systemLoaded = true;
    renderSystem();
    renderSettings();
    return true;
  } catch (error) {
    systemLoaded = false;
    systemPersistent = false;
    setText('[data-system-connection]', 'Unavailable');
    if (systemStatus) {
      systemStatus.textContent = error?.message || 'History & Recovery is unavailable.';
      systemStatus.className = 'rc-export-status is-error';
    }
    return false;
  }
}

async function systemPost(payload) {
  const response = await fetch('/api/admin/system', {
    method:'POST',
    credentials:'same-origin',
    headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not complete that recovery action.');
  return data;
}

async function refreshEditorsAfterRecovery() {
  await loadQuickControl();
  conciergeLoaded = false;
  mediaLoaded = false;
  await loadConcierge();
  await loadMedia();
  setDirty(false);
  conciergeDirty = false;
  mediaDirty = false;
}

async function createManualRecoveryPoint() {
  const label = window.prompt('Name this recovery point:', 'Manual recovery point');
  if (label === null) return;
  try {
    const data = await systemPost({action:'snapshot', label:label || 'Manual recovery point'});
    systemEvents = data.events || [];
    systemSnapshots = data.snapshots || [];
    systemPersistent = Boolean(data.persistent);
    systemLoaded = true;
    renderSystem();
  } catch (error) {
    if (systemStatus) {
      systemStatus.textContent = error.message;
      systemStatus.className = 'rc-export-status is-error';
    }
  }
}

async function restoreSystemSnapshot(id) {
  if (!window.confirm('Restore this recovery point into Website, Concierge and Media Drafts? Nothing will be published.')) return;
  try {
    const data = await systemPost({action:'restoreSnapshot', id});
    await refreshEditorsAfterRecovery();
    systemLoaded = false;
    await loadSystem();
    if (systemStatus) {
      systemStatus.textContent = data.message || 'Recovery point restored to Draft.';
      systemStatus.className = 'rc-export-status is-good';
    }
  } catch (error) {
    if (systemStatus) {
      systemStatus.textContent = error.message;
      systemStatus.className = 'rc-export-status is-error';
    }
  }
}

async function downloadSystemBackup() {
  try {
    const response = await fetch('/api/admin/system?action=export', {
      method:'GET', credentials:'same-origin', cache:'no-store',
      headers:{Accept:'application/json'}
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.bundle) throw new Error(data.error || 'Could not build the backup.');
    const stamp = new Date().toISOString().replace(/[:.]/g,'-');
    const blob = new Blob([JSON.stringify(data.bundle,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rebecca-control-backup-' + stamp + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    if (systemStatus) {
      systemStatus.textContent = 'Backup downloaded.';
      systemStatus.className = 'rc-export-status is-good';
    }
  } catch (error) {
    if (systemStatus) {
      systemStatus.textContent = error.message;
      systemStatus.className = 'rc-export-status is-error';
    }
  }
}

async function readBackupFile(file) {
  systemImportBundle = null;
  if (systemImportButton) systemImportButton.disabled = true;
  setText('[data-system-import-name]', file?.name || 'No file selected');
  if (!file) return;
  try {
    if (file.size > 8 * 1024 * 1024) throw new Error('Backup file is too large.');
    const parsed = JSON.parse(await file.text());
    if (parsed?.format !== 'rebecca-control-backup' || Number(parsed?.version) !== 1) {
      throw new Error('This is not a supported Rebecca Control backup.');
    }
    systemImportBundle = parsed;
    if (systemImportButton) systemImportButton.disabled = false;
    if (systemStatus) {
      systemStatus.textContent = 'Backup validated locally. Ready to restore to Draft.';
      systemStatus.className = 'rc-export-status is-good';
    }
  } catch (error) {
    setText('[data-system-import-name]', 'Invalid backup');
    if (systemStatus) {
      systemStatus.textContent = error.message || 'Could not read that backup.';
      systemStatus.className = 'rc-export-status is-error';
    }
  }
}

async function restoreImportedBackup() {
  if (!systemImportBundle) return;
  if (!window.confirm('Restore this backup into Website, Concierge and Media Drafts? Nothing will be published.')) return;
  try {
    const data = await systemPost({action:'restoreBundle', bundle:systemImportBundle});
    await refreshEditorsAfterRecovery();
    systemImportBundle = null;
    if (systemImportFile) systemImportFile.value = '';
    if (systemImportButton) systemImportButton.disabled = true;
    setText('[data-system-import-name]', 'No file selected');
    systemLoaded = false;
    await loadSystem();
    if (systemStatus) {
      systemStatus.textContent = data.message || 'Backup restored to Draft.';
      systemStatus.className = 'rc-export-status is-good';
    }
  } catch (error) {
    if (systemStatus) {
      systemStatus.textContent = error.message;
      systemStatus.className = 'rc-export-status is-error';
    }
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
      if (!requestedTab && data.control?.settings?.dashboardStartTab) {
        activeTab = data.control.settings.dashboardStartTab;
      }
      const validTab = document.querySelector('[data-tab="' + esc(activeTab) + '"]')
        ? activeTab
        : 'insights';
      activateTab(validTab);
      if (visualReturn) {
        const editLink = document.querySelector('[data-edit-website]');
        if (editLink) editLink.href = visualReturn;
      }
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
    scheduleState = null;
    mediaState = null;
    mediaSchedule = null;
    mediaSchedulePhase = 'none';
    mediaLoaded = false;
    conciergeState = null;
    conciergePublished = null;
    conciergeHistory = [];
    conciergeLoaded = false;
    conciergeDirty = false;
    conciergeDraftAhead = false;
    conciergeTestHistory = [];
    needsItems = [];
    needsSummary = { open: 0, drafted: 0, closed: 0, recurring: 0, total: 0 };
    needsPersistent = false;
    needsLoaded = false;
    needsFilter = 'open';
    assistantProposal = null;
    assistantBusy = false;
    systemEvents = [];
    systemSnapshots = [];
    systemLoaded = false;
    systemPersistent = false;
    systemImportBundle = null;
    insightsState = null;
    insightsLoaded = false;
    settingsState = {
      dashboardStartTab:'insights',
      aiAssistantEnabled:true,
      needsRebeccaCaptureEnabled:true,
      automaticRecoveryEnabled:true
    };
    settingsDirty = false;
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
    if (index >= 0) {
      if (list.length <= 1) {
        setText('[data-media-draft-detail]', 'Keep at least one photo in every website area.');
        return;
      }
      list.splice(index, 1);
    } else if (list.length < placement.max) list.push(id);
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
    updateAvailabilityExpirySummary();
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
      startDate: null,
      endDate: null,
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
    event.target.matches('[data-availability-message], [data-availability-until], [data-trip], [data-rate], [data-contact], [data-profile]')
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
  if (event.target.matches('[data-media-schedule-publish]')) {
    if (mediaScheduleExpireInput) mediaScheduleExpireInput.min = event.target.value || singaporeNowLocalInput();
    renderMediaSchedule();
  }
  if (event.target.matches('[data-media-schedule-expire]')) {
    renderMediaSchedule();
  }

  if (event.target.matches('[data-trip-visible], [data-rate-visible], [data-rate-featured], [data-availability-until], [data-availability-revert]')) {
    setDirty(true);
    if (event.target.matches('[data-availability-until], [data-availability-revert]')) {
      updateAvailabilityExpirySummary();
    }
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


document.addEventListener('click', async (event) => {
  const example = event.target.closest('[data-assistant-example]');
  if (example && assistantPrompt) {
    assistantPrompt.value = example.dataset.assistantExample || '';
    assistantPrompt.focus();
    return;
  }

  const apply = event.target.closest('[data-assistant-apply]');
  if (apply) {
    await applyAssistantProposal(Number(apply.dataset.assistantApply));
  }
});

document.addEventListener('click', async (event) => {
  if (event.target.closest('[data-insights-refresh]')) {
    insightsLoaded = false;
    await loadInsights();
    return;
  }
  const insight = event.target.closest('[data-insights-tab]');
  if (insight) {
    activateTab(insight.dataset.insightsTab || 'insights');
    return;
  }
});

document.addEventListener('click', async (event) => {
  if (event.target.closest('[data-system-refresh]')) {
    systemLoaded = false;
    await loadSystem();
    return;
  }
  if (event.target.closest('[data-system-snapshot]')) {
    await createManualRecoveryPoint();
    return;
  }
  const restore = event.target.closest('[data-system-restore]');
  if (restore) {
    await restoreSystemSnapshot(restore.dataset.systemRestore);
    return;
  }
  if (event.target.closest('[data-system-export]')) {
    await downloadSystemBackup();
    return;
  }
  if (event.target.closest('[data-system-import-choose]')) {
    systemImportFile?.click();
    return;
  }
  if (event.target.closest('[data-system-import]')) {
    await restoreImportedBackup();
  }
});

systemImportFile?.addEventListener('change', (event) => {
  readBackupFile(event.target.files?.[0]);
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-setting],[data-setting-toggle]')) {
    settingsDirty = true;
    renderSettings();
  }
});

settingsSaveButton?.addEventListener('click', saveSettings);

assistantProposeButton?.addEventListener('click', prepareAssistantProposal);
assistantPrompt?.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    prepareAssistantProposal();
  }
});

document.addEventListener('click', async (event) => {
  const filter = event.target.closest('[data-needs-filter]');
  if (filter) {
    needsFilter = filter.dataset.needsFilter || 'open';
    renderNeedsRebecca();
    return;
  }

  const draft = event.target.closest('[data-needs-draft-answer]');
  if (draft) {
    await draftNeedsRebeccaAnswer(draft.dataset.needsDraftAnswer);
    return;
  }

  const status = event.target.closest('[data-needs-status-id]');
  if (status) {
    await needsAction({
      action: 'status',
      id: status.dataset.needsStatusId,
      status: status.dataset.needsStatusValue
    });
    return;
  }

  const remove = event.target.closest('[data-needs-delete]');
  if (remove && window.confirm('Delete this closed question from Needs Rebecca?')) {
    await needsAction({ action: 'delete', id: remove.dataset.needsDelete });
    return;
  }

  if (event.target.closest('[data-needs-clear-closed]')) {
    if (needsSummary.closed > 0 && window.confirm('Clear all resolved and ignored Needs Rebecca questions?')) {
      await needsAction({ action: 'clearClosed' });
    }
  }
});

document.addEventListener('click', (event) => {
  const status = event.target.closest('[data-concierge-status]');
  if (status && conciergeState) {
    document.querySelectorAll('[data-concierge-status]').forEach((button) => button.classList.remove('is-selected'));
    status.classList.add('is-selected');
    setConciergeDirty(true);
    return;
  }

  if (event.target.closest('[data-concierge-add-answer]') && conciergeState) {
    conciergeState.trustedAnswers = conciergeState.trustedAnswers || [];
    conciergeState.trustedAnswers.push({
      id: 'answer-' + Date.now(),
      question: '',
      answer: '',
      keywords: [],
      linkPath: '',
      linkLabel: '',
      enabled: true
    });
    renderConcierge();
    setConciergeDirty(true);
    return;
  }

  const remove = event.target.closest('[data-concierge-remove-answer]');
  if (remove && conciergeState) {
    const card = remove.closest('[data-concierge-answer-index]');
    const index = Number(card?.dataset.conciergeAnswerIndex);
    if (Number.isInteger(index) && window.confirm('Remove this Trusted Answer from the Draft?')) {
      conciergeState.trustedAnswers.splice(index, 1);
      renderConcierge();
      setConciergeDirty(true);
    }
    return;
  }

  const restore = event.target.closest('[data-concierge-restore]');
  if (restore) {
    restoreConcierge(Number(restore.dataset.conciergeRestore));
    return;
  }

  if (event.target.closest('[data-concierge-test-clear]')) {
    conciergeTestHistory = [];
    if (conciergeTestThread) {
      conciergeTestThread.innerHTML = '<div class="rc-test-message assistant"><span>Rebecca’s Desk · Draft</span><p>Test cleared. Ask another visitor question when you are ready.</p></div>';
    }
    setText('[data-concierge-test-note]', 'Uses Draft—not the live concierge.');
  }
});

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-concierge-field],[data-concierge-answer-field]')) {
    setConciergeDirty(true);
  }
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-concierge-answer-enabled]')) {
    setConciergeDirty(true);
  }
});

conciergeSaveButton?.addEventListener('click', () => saveConciergeDraft());
conciergePublishButton?.addEventListener('click', publishConcierge);
conciergeDiscardButton?.addEventListener('click', discardConcierge);
conciergeTestForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await runConciergeTest(conciergeTestInput?.value);
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

    quickState = data.effectiveState || data.state;
    scheduleState = data.schedule || null;
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
mediaScheduleButton?.addEventListener('click', scheduleMediaPublish);
mediaScheduleCancelButton?.addEventListener('click', cancelScheduledMedia);
mediaScheduleCommitButton?.addEventListener('click', commitScheduledMedia);
mediaSchedulePreviewButton?.addEventListener('click', previewScheduledMedia);

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
  if (!dirty && !mediaDirty && !conciergeDirty) return;
  event.preventDefault();
  event.returnValue = '';
});

loadSession();
