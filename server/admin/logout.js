import { makeExpiredSessionCookie } from '../../lib/admin-auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  res.setHeader('Set-Cookie', makeExpiredSessionCookie());
  return res.status(200).json({ ok: true });
}
