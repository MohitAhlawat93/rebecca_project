const loginView = document.querySelector('[data-login-view]');
const appView = document.querySelector('[data-app-view]');
const loginForm = document.querySelector('[data-login-form]');
const loginMessage = document.querySelector('[data-login-message]');
const logoutButton = document.querySelector('[data-logout]');
const saveButton = document.querySelector('[data-save]');
const saveState = document.querySelector('[data-save-state]');
const saveDetail = document.querySelector('[data-save-detail]');
const storeBanner = document.querySelector('[data-store-banner]');

let quickState = null;
let persistentStore = false;
let dirty = false;
let activeTab = 'availability';

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
    showLogin('Signed out.');
  }
});

document.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (tab) {
    activateTab(tab.dataset.tab);
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
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-trip-visible], [data-rate-visible], [data-rate-featured]')) {
    setDirty(true);
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

loadSession();
