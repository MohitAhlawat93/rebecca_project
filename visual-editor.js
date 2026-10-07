const clone = (value) => JSON.parse(JSON.stringify(value));

const STATUS_LABELS = {
  accepting: 'Accepting enquiries',
  limited: 'Limited availability',
  travelling: 'Travelling',
  away: 'Temporarily away',
  unavailable: 'Not accepting enquiries'
};

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

let draftState = null;
let hasDraftChanges = false;
let previewOnly = false;
let activeTarget = null;

const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
styleLink.href = '/visual-editor.css';
document.head.appendChild(styleLink);

function setRuntimePreview(data) {
  if (!data || !window.__REBECCA_DATA__) return;
  ['availability', 'profile', 'singapore', 'travel', 'contact'].forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      window.__REBECCA_DATA__[key] = clone(data[key]);
    }
  });
  window.__RC_RENDER_STRUCTURED__?.();
  decorateTargets();
}

function editorPath() {
  return window.location.pathname + window.location.search + window.location.hash;
}

function adminMediaUrl(placement) {
  const url = new URL('/admin', window.location.origin);
  url.searchParams.set('tab', 'media');
  url.searchParams.set('placement', placement);
  url.searchParams.set('return', window.location.pathname);
  return url.pathname + url.search;
}

function showToast(message, error = false) {
  document.querySelector('.rc-ve-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'rc-ve-toast' + (error ? ' is-error' : '');
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), error ? 5000 : 2600);
}

function statusText() {
  if (!hasDraftChanges) return 'Live website';
  return 'Private draft saved';
}

function updateToolbar() {
  const status = document.querySelector('[data-ve-status]');
  const publish = document.querySelector('[data-ve-publish]');
  const discard = document.querySelector('[data-ve-discard]');
  const preview = document.querySelector('[data-ve-preview]');
  if (status) status.textContent = statusText();
  if (publish) publish.disabled = !hasDraftChanges;
  if (discard) discard.disabled = !hasDraftChanges;
  if (preview) preview.textContent = previewOnly ? 'Edit' : 'Preview';
}

function closePanel() {
  const panel = document.querySelector('[data-ve-panel]');
  if (panel) panel.hidden = true;
  activeTarget?.classList.remove('is-rc-edit-target');
  activeTarget = null;
}

function panelShell(title, description, body) {
  const panel = document.querySelector('[data-ve-panel]');
  if (!panel) return;
  panel.innerHTML = `
    <div class="rc-ve-panel-inner">
      <div class="rc-ve-panel-head">
        <div>
          <span class="rc-ve-kicker">Visual website editor</span>
          <strong>${esc(title)}</strong>
          <p>${esc(description)}</p>
        </div>
        <button type="button" class="rc-ve-close" data-ve-close aria-label="Close editor">×</button>
      </div>
      <form class="rc-ve-form" data-ve-form>
        ${body}
      </form>
    </div>
  `;
  panel.hidden = false;
}

function field(label, name, value = '', options = {}) {
  const wide = options.wide ? ' is-wide' : '';
  const type = options.type || 'text';
  if (type === 'textarea') {
    return `<label class="rc-ve-field${wide}"><span>${esc(label)}</span><textarea name="${esc(name)}" maxlength="${options.max || 800}">${esc(value)}</textarea></label>`;
  }
  if (type === 'select') {
    return `<label class="rc-ve-field${wide}"><span>${esc(label)}</span><select name="${esc(name)}">${(options.items || []).map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  }
  return `<label class="rc-ve-field${wide}"><span>${esc(label)}</span><input type="${esc(type)}" name="${esc(name)}" value="${esc(value ?? '')}"${options.max ? ` maxlength="${options.max}"` : ''}></label>`;
}

function check(label, name, checked) {
  return `<label class="rc-ve-check"><input type="checkbox" name="${esc(name)}"${checked ? ' checked' : ''}><span>${esc(label)}</span></label>`;
}

function formActions(label = 'Save to Draft') {
  return `<div class="rc-ve-panel-actions"><button type="button" data-ve-close>Cancel</button><button type="submit" class="is-primary">${esc(label)}</button></div>`;
}

async function saveDraft(nextState, message = 'Draft saved.') {
  const response = await fetch('/api/admin/visual-editor', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ state: nextState })
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.location.href = '/admin?visualReturn=' + encodeURIComponent(editorPath());
    return null;
  }
  if (!response.ok) throw new Error(data.error || 'Could not save the visual draft.');

  draftState = data.draft;
  hasDraftChanges = Boolean(data.hasDraftChanges);
  setRuntimePreview(data.previewData);
  updateToolbar();
  showToast(message);
  return data;
}

function formValue(form, name) {
  return String(new FormData(form).get(name) || '').trim();
}

function openAvailability(target) {
  const item = draftState.availability || {};
  panelShell(
    'Availability',
    'This changes the same availability used by the website and concierge.',
    `<div class="rc-ve-grid">
      ${field('Status', 'status', item.status || 'accepting', {
        type: 'select',
        items: Object.entries(STATUS_LABELS)
      })}
      ${field('Keep until', 'until', item.until || '', { type: 'date' })}
      ${field('Visitor message', 'message', item.message || '', { type: 'textarea', wide: true, max: 280 })}
      ${field('After expiry return to', 'revertStatus', item.revertStatus || 'accepting', {
        type: 'select',
        items: Object.entries(STATUS_LABELS),
        wide: true
      })}
    </div>
    ${formActions()}`
  );

  document.querySelector('[data-ve-form]').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = formValue(form, 'status') || 'accepting';
    const next = clone(draftState);
    next.availability = {
      ...next.availability,
      status,
      label: STATUS_LABELS[status] || next.availability.label,
      message: formValue(form, 'message'),
      until: formValue(form, 'until') || null,
      revertStatus: formValue(form, 'revertStatus') || 'accepting',
      revertMessage: ''
    };
    try {
      await saveDraft(next, 'Availability saved to Draft.');
      closePanel();
    } catch (error) {
      showToast(error.message, true);
    }
  };
}

function openProfile(target) {
  const item = draftState.profile || {};
  panelShell(
    'Profile details',
    'Edit the structured facts that appear across Home and About.',
    `<div class="rc-ve-grid">
      ${field('Display name', 'displayName', item.displayName || '', { wide: true, max: 100 })}
      ${field('Primary base', 'base', item.base || '', { max: 100 })}
      ${field('Secondary base', 'secondaryBase', item.secondaryBase || '', { max: 120 })}
      ${field('Age', 'age', item.age || '', { max: 60 })}
      ${field('Heritage', 'heritage', item.heritage || '', { max: 100 })}
      ${field('Height metric', 'heightMetric', item.heightMetric || '', { max: 40 })}
      ${field('Height imperial', 'heightImperial', item.heightImperial || '', { max: 40 })}
      ${field('Languages · comma separated', 'languages', (item.languages || []).join(', '), { wide: true, max: 240 })}
    </div>
    ${formActions()}`
  );

  document.querySelector('[data-ve-form]').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const next = clone(draftState);
    next.profile = {
      ...next.profile,
      displayName: formValue(form, 'displayName'),
      base: formValue(form, 'base'),
      secondaryBase: formValue(form, 'secondaryBase'),
      age: formValue(form, 'age'),
      heritage: formValue(form, 'heritage'),
      heightMetric: formValue(form, 'heightMetric'),
      heightImperial: formValue(form, 'heightImperial'),
      languages: formValue(form, 'languages').split(',').map((v) => v.trim()).filter(Boolean)
    };
    try {
      await saveDraft(next, 'Profile saved to Draft.');
      closePanel();
    } catch (error) {
      showToast(error.message, true);
    }
  };
}

function openRate(id) {
  const index = (draftState.rates || []).findIndex((item) => item.id === id);
  if (index < 0) return;
  const item = draftState.rates[index];

  panelShell(
    item.label || 'Rate',
    'Change this rate card without editing code.',
    `<div class="rc-ve-grid">
      ${field('Label', 'label', item.label || '', { wide: true, max: 100 })}
      ${field('Amount', 'amount', item.amount ?? '', { type: 'number' })}
      ${field('Display price', 'display', item.display || '', { max: 80 })}
      ${field('Category', 'category', item.category || '', { wide: true, max: 100 })}
      ${field('Note', 'note', item.note || '', { type: 'textarea', wide: true, max: 180 })}
      <div class="rc-ve-field is-wide">
        ${check('Visible on website', 'visible', item.visible !== false)}
        ${check('Featured rate', 'featured', Boolean(item.featured))}
      </div>
    </div>
    ${formActions()}`
  );

  document.querySelector('[data-ve-form]').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const next = clone(draftState);
    next.rates[index] = {
      ...next.rates[index],
      label: formValue(form, 'label'),
      amount: formValue(form, 'amount') === '' ? null : Number(formValue(form, 'amount')),
      display: formValue(form, 'display'),
      category: formValue(form, 'category'),
      note: formValue(form, 'note'),
      visible: data.get('visible') === 'on',
      featured: data.get('featured') === 'on'
    };
    try {
      await saveDraft(next, 'Rate saved to Draft.');
      closePanel();
    } catch (error) {
      showToast(error.message, true);
    }
  };
}

function openTravel(id) {
  const index = (draftState.travel || []).findIndex((item) => item.id === id);
  if (index < 0) return;
  const item = draftState.travel[index];

  panelShell(
    item.title || 'Travel window',
    'Edit the public wording and automatic lifecycle dates for this trip.',
    `<div class="rc-ve-grid">
      ${field('Headline', 'title', item.title || '', { wide: true, max: 180 })}
      ${field('Public date wording', 'dateRange', item.dateRange || '', { wide: true, max: 140 })}
      ${field('Starts', 'startDate', item.startDate || '', { type: 'date' })}
      ${field('Ends', 'endDate', item.endDate || '', { type: 'date' })}
      ${field('Cities · comma separated', 'cities', (item.cities || []).join(', '), { wide: true, max: 300 })}
      ${field('Description', 'body', item.body || '', { type: 'textarea', wide: true, max: 800 })}
      ${field('Public notes · comma separated', 'meta', (item.meta || []).join(', '), { wide: true, max: 500 })}
      <div class="rc-ve-field is-wide">${check('Visible when lifecycle permits', 'visible', item.visible !== false)}</div>
    </div>
    ${formActions()}`
  );

  document.querySelector('[data-ve-form]').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const next = clone(draftState);
    next.travel[index] = {
      ...next.travel[index],
      title: formValue(form, 'title'),
      dateRange: formValue(form, 'dateRange'),
      startDate: formValue(form, 'startDate') || null,
      endDate: formValue(form, 'endDate') || null,
      cities: formValue(form, 'cities').split(',').map((v) => v.trim()).filter(Boolean),
      body: formValue(form, 'body'),
      meta: formValue(form, 'meta').split(',').map((v) => v.trim()).filter(Boolean),
      visible: data.get('visible') === 'on'
    };
    try {
      await saveDraft(next, 'Travel saved to Draft.');
      closePanel();
    } catch (error) {
      showToast(error.message, true);
    }
  };
}

function openContact() {
  const item = draftState.contact || {};
  panelShell(
    'Contact details',
    'These are Rebecca’s verified public contact routes.',
    `<div class="rc-ve-grid">
      ${field('Phone', 'phoneDisplay', item.phoneDisplay || '', { wide: true, max: 80 })}
      ${field('Telegram handle', 'telegramHandle', item.telegramHandle || '', { max: 80 })}
      ${field('Email', 'email', item.email || '', { type: 'email', max: 180 })}
      ${field('Telegram channel label', 'telegramChannelLabel', item.telegramChannelLabel || '', { wide: true, max: 100 })}
      ${field('Telegram channel URL', 'telegramChannelUrl', item.telegramChannelUrl || '', { type: 'url', wide: true, max: 500 })}
    </div>
    ${formActions()}`
  );

  document.querySelector('[data-ve-form]').onsubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const next = clone(draftState);
    next.contact = {
      ...next.contact,
      phoneDisplay: formValue(form, 'phoneDisplay'),
      telegramHandle: formValue(form, 'telegramHandle'),
      email: formValue(form, 'email'),
      telegramChannelLabel: formValue(form, 'telegramChannelLabel'),
      telegramChannelUrl: formValue(form, 'telegramChannelUrl')
    };
    try {
      await saveDraft(next, 'Contact details saved to Draft.');
      closePanel();
    } catch (error) {
      showToast(error.message, true);
    }
  };
}

function openMediaPlacement(placement, target) {
  const image = target.querySelector('img') || target.closest('figure')?.querySelector('img');
  panelShell(
    'Photos · ' + placement,
    'Photo selection stays in the dedicated Media & Publish workflow so its Draft, Preview, Schedule and History protections remain intact.',
    `${image ? `<div class="rc-ve-media-preview"><img src="${esc(image.currentSrc || image.src)}" alt=""></div>` : ''}
      <div class="rc-ve-note">You started from this exact website area. Rebecca Control will open the matching photo placement automatically.</div>
      <div class="rc-ve-panel-actions">
        <button type="button" data-ve-close>Cancel</button>
        <a class="is-primary" href="${esc(adminMediaUrl(placement))}">Manage these photos ↗</a>
      </div>`
  );
}

function openTarget(target) {
  activeTarget?.classList.remove('is-rc-edit-target');
  activeTarget = target;
  activeTarget.classList.add('is-rc-edit-target');

  const placement = target.dataset.rcMediaPlacement;
  if (placement) {
    openMediaPlacement(placement, target);
    return;
  }

  const spec = target.dataset.rcEdit || '';
  if (spec === 'availability') return openAvailability(target);
  if (spec === 'profile') return openProfile(target);
  if (spec === 'contact') return openContact(target);
  if (spec.startsWith('rate:')) return openRate(spec.slice(5));
  if (spec.startsWith('travel:')) return openTravel(spec.slice(7));
}

function decorateTargets() {
  document.querySelectorAll('[data-rc-edit],[data-rc-media-placement]').forEach((el) => {
    el.querySelector(':scope > .rc-ve-badge')?.remove();
    const badge = document.createElement('span');
    badge.className = 'rc-ve-badge';
    badge.textContent = el.dataset.rcMediaPlacement ? 'Photos' : 'Edit';
    el.appendChild(badge);
  });
}

function buildUi() {
  document.documentElement.classList.add('rc-visual-editing');

  const toolbar = document.createElement('div');
  toolbar.className = 'rc-ve-toolbar';
  toolbar.innerHTML = `
    <div class="rc-ve-toolbar-copy">
      <strong>Edit Website</strong>
      <span data-ve-status>Loading Draft…</span>
    </div>
    <button type="button" data-ve-preview>Preview</button>
    <button type="button" class="rc-ve-danger" data-ve-discard disabled>Discard</button>
    <button type="button" class="rc-ve-publish" data-ve-publish disabled>Publish</button>
    <button type="button" data-ve-exit>Exit</button>
  `;
  document.body.appendChild(toolbar);

  const panel = document.createElement('aside');
  panel.className = 'rc-ve-panel';
  panel.dataset.vePanel = 'true';
  panel.hidden = true;
  document.body.appendChild(panel);

  toolbar.querySelector('[data-ve-preview]').onclick = () => {
    previewOnly = !previewOnly;
    document.documentElement.classList.toggle('rc-visual-preview', previewOnly);
    if (previewOnly) closePanel();
    updateToolbar();
  };

  toolbar.querySelector('[data-ve-exit]').onclick = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('rc_edit');
    window.location.href = url.pathname + url.search + url.hash;
  };

  toolbar.querySelector('[data-ve-publish]').onclick = publishDraft;
  toolbar.querySelector('[data-ve-discard]').onclick = discardDraft;

  document.addEventListener('click', (event) => {
    if (event.target.closest('.rc-ve-toolbar,.rc-ve-panel,.rc-ve-toast')) {
      if (event.target.closest('[data-ve-close]')) closePanel();
      return;
    }

    if (!previewOnly) {
      const target = event.target.closest('[data-rc-edit],[data-rc-media-placement]');
      if (target) {
        event.preventDefault();
        event.stopPropagation();
        openTarget(target);
        return;
      }
    }

    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank') return;
    try {
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith('/admin')) return;
      url.searchParams.set('rc_edit', '1');
      link.href = url.pathname + url.search + url.hash;
    } catch {}
  }, true);

  decorateTargets();
}

async function publishDraft() {
  if (!hasDraftChanges) return;
  if (!window.confirm('Publish this saved Visual Editor Draft to the live website and concierge now?')) return;

  const button = document.querySelector('[data-ve-publish]');
  button.disabled = true;
  button.textContent = 'Publishing…';

  try {
    const response = await fetch('/api/admin/visual-editor', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'publish' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not publish the visual draft.');
    draftState = data.draft;
    hasDraftChanges = false;
    setRuntimePreview(data.previewData);
    closePanel();
    updateToolbar();
    showToast('Published to the live website and concierge.');
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.textContent = 'Publish';
    updateToolbar();
  }
}

async function discardDraft() {
  if (!hasDraftChanges) return;
  if (!window.confirm('Discard the saved Visual Editor Draft and return to the current live content?')) return;

  try {
    const response = await fetch('/api/admin/visual-editor', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'discard' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not discard the visual draft.');
    draftState = data.draft;
    hasDraftChanges = false;
    setRuntimePreview(data.previewData);
    closePanel();
    updateToolbar();
    showToast('Draft discarded. Showing live content.');
  } catch (error) {
    showToast(error.message, true);
  }
}

async function initialize() {
  const sessionResponse = await fetch('/api/admin/session', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  });
  if (!sessionResponse.ok) {
    window.location.href = '/admin?visualReturn=' + encodeURIComponent(editorPath());
    return;
  }

  const response = await fetch('/api/admin/visual-editor', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Could not load Visual Editor.');

  draftState = data.draft;
  hasDraftChanges = Boolean(data.hasDraftChanges);

  buildUi();
  setRuntimePreview(data.previewData);
  updateToolbar();

  if (hasDraftChanges) showToast('Loaded your saved private Visual Editor Draft.');
}

initialize().catch((error) => {
  showToast(error?.message || 'Visual Editor could not start.', true);
});
