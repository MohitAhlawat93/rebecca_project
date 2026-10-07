import {
  adminAuthConfigured,
  constantTimeTextEqual,
  createSessionToken,
  getClientIp,
  makeSessionCookie,
  verifyPasswordHash
} from '../../lib/admin-auth.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = globalThis.__RC_ADMIN_LOGIN_ATTEMPTS__ || (globalThis.__RC_ADMIN_LOGIN_ATTEMPTS__ = new Map());

function rateLimit(req) {
  const key = getClientIp(req);
  const now = Date.now();
  let bucket = attempts.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
  }

  bucket.count += 1;
  attempts.set(key, bucket);

  if (attempts.size > 1000) {
    for (const [ip, value] of attempts) {
      if (now >= value.resetAt) attempts.delete(ip);
    }
  }

  return {
    allowed: bucket.count <= MAX_ATTEMPTS,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    key
  };
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!adminAuthConfigured()) {
    return res.status(503).json({ error: 'Rebecca Control is not configured yet.' });
  }

  const limit = rateLimit(req);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    return res.status(429).json({ error: 'Too many sign-in attempts. Please try again later.' });
  }

  const body = readBody(req);
  const loginId = typeof body.loginId === 'string' ? body.loginId.trim().slice(0, 120) : '';
  const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';

  const expectedLogin = String(process.env.RC_ADMIN_LOGIN_ID || '').trim();
  const loginOk = constantTimeTextEqual(loginId, expectedLogin);
  const passwordOk = verifyPasswordHash(password, process.env.RC_ADMIN_PASSWORD_HASH || '');

  if (!loginOk || !passwordOk) {
    return res.status(401).json({ error: 'That owner ID or password is not correct.' });
  }

  attempts.delete(limit.key);
  const token = createSessionToken(expectedLogin);
  res.setHeader('Set-Cookie', makeSessionCookie(token));

  return res.status(200).json({ ok: true, role: 'owner' });
}
