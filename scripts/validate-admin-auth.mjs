import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const salt = Buffer.from('00112233445566778899aabbccddeeff', 'hex');
const password = 'RC01-validation-password';
const derived = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });

process.env.RC_ADMIN_LOGIN_ID = 'validation-owner';
process.env.RC_ADMIN_PASSWORD_HASH = [
  'scrypt',
  '16384',
  '8',
  '1',
  salt.toString('base64url'),
  derived.toString('base64url')
].join('$');
process.env.RC_SESSION_SECRET = 'validation-only-secret-that-is-long-enough-for-testing-1234567890';

const {
  adminAuthConfigured,
  createSessionToken,
  verifyPasswordHash,
  verifySessionToken
} = await import('../lib/admin-auth.js');

assert.equal(adminAuthConfigured(), true);
assert.equal(verifyPasswordHash(password, process.env.RC_ADMIN_PASSWORD_HASH), true);
assert.equal(verifyPasswordHash('wrong-password', process.env.RC_ADMIN_PASSWORD_HASH), false);

const token = createSessionToken('validation-owner');
const session = verifySessionToken(token);
assert.equal(session?.role, 'owner');
assert.equal(session?.sub, 'validation-owner');

console.log('RC-01 admin authentication validation passed.');
