const loginView = document.querySelector('[data-login-view]');
const appView = document.querySelector('[data-app-view]');
const loginForm = document.querySelector('[data-login-form]');
const loginMessage = document.querySelector('[data-login-message]');
const logoutButton = document.querySelector('[data-logout]');

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value ?? '—';
}

function showLogin(message = '') {
  loginView.hidden = false;
  appView.hidden = true;
  loginMessage.textContent = message;
}

function showApp(data) {
  loginView.hidden = true;
  appView.hidden = false;
  setText('[data-data-version]', data?.site?.dataVersion);
  setText('[data-last-verified]', data?.site?.lastVerified);
  setText('[data-rate-count]', data?.site?.singaporeRateCount);
  setText('[data-travel-count]', data?.site?.travelWindowCount);
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
    showLogin('Signed out.');
  }
});

loadSession();
