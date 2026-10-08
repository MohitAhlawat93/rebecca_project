import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { validateOwnerWriteOrigin } from '../lib/admin-origin-guard.js';
import { validateBundle } from '../lib/system-store.js';
import { buildDefaultQuickControlState } from '../lib/admin-store.js';
import { buildDefaultConciergeControl } from '../lib/concierge-control-store.js';
import { buildDefaultMediaState } from '../lib/media-store.js';

const salt=Buffer.from('11223344556677889900aabbccddeeff','hex');
function hash(word){
  return ['scrypt','16384','8','1',salt.toString('base64url'),
    crypto.scryptSync(word,salt,32,{N:16384,r:8,p:1,maxmem:64*1024*1024}).toString('base64url')].join('$');
}
const original={
  RC_ADMIN_LOGIN_ID:process.env.RC_ADMIN_LOGIN_ID,
  RC_ADMIN_PASSWORD_HASH:process.env.RC_ADMIN_PASSWORD_HASH,
  RC_SESSION_SECRET:process.env.RC_SESSION_SECRET
};
process.env.RC_ADMIN_LOGIN_ID='fixture-owner';
process.env.RC_ADMIN_PASSWORD_HASH=hash('test-only-A');
process.env.RC_SESSION_SECRET='test-only-session-secret-more-than-thirty-two-characters';
try {
  const {createSessionToken,verifySessionToken,parseCookies,makeSessionCookie}=await import('../lib/admin-auth.js');
  const first=createSessionToken('fixture-owner');
  assert.equal(verifySessionToken(first)?.role,'owner');
  assert.match(makeSessionCookie(first),/HttpOnly; SameSite=Strict/);
  assert.equal(verifySessionToken(first+'.extra'),null);
  assert.equal(verifySessionToken('a'.repeat(4097)),null);
  assert.equal(verifySessionToken(first.slice(0,-2)+'zz'),null);
  assert.doesNotThrow(()=>parseCookies({headers:{cookie:'bad=%INVALID; rc_admin_session=bad'}}));
  process.env.RC_ADMIN_PASSWORD_HASH=hash('test-only-B');
  assert.equal(verifySessionToken(first),null,'Password hash rotation revokes existing sessions');
  const newer=createSessionToken('fixture-owner');
  assert.equal(verifySessionToken(newer)?.role,'owner');
  process.env.RC_SESSION_SECRET='second-test-only-session-secret-long-enough-123';
  assert.equal(verifySessionToken(newer),null,'Session secret rotation revokes sessions');
} finally {
  for(const [key,value] of Object.entries(original)) {
    if(value===undefined)delete process.env[key]; else process.env[key]=value;
  }
}

function allow(method,origin,host='rebeccaproject.vercel.app',site){
  return validateOwnerWriteOrigin({method,headers:{host,...(origin?{origin}:{}),...(site?{'sec-fetch-site':site}:{})}}).allowed;
}
assert.equal(allow('GET','https://attacker.example'),true);
assert.equal(allow('POST','https://rebeccaproject.vercel.app'),true);
assert.equal(allow('PUT','https://rebeccaproject.vercel.app'),true);
assert.equal(allow('POST','https://attacker.example'),false);
assert.equal(allow('DELETE','http://rebeccaproject.vercel.app'),false);
assert.equal(allow('POST','https://rebeccaproject.vercel.app.evil.example'),false);
assert.equal(allow('POST','not-a-url'),false);
assert.equal(allow('POST','https://rebeccaproject.vercel.app','rebeccaproject.vercel.app','cross-site'),false);
assert.equal(allow('POST',null),true,'Missing Origin allowed for compatible server requests');
assert.equal(allow('POST','http://localhost:4179','localhost:4179'),true);
const router=fs.readFileSync(new URL('../api/admin/[route].js',import.meta.url),'utf8');
assert.match(router,/validateOwnerWriteOrigin\(req\)/);
assert.match(router,/route !== 'media-upload'/);
assert.match(router,/return res.status\(403\)/);

const backup={format:'rebecca-control-backup',version:1,
  data:{
    website:{published:buildDefaultQuickControlState()},
    concierge:{published:buildDefaultConciergeControl()},
    media:{published:buildDefaultMediaState()}
  }
};
assert.equal(validateBundle(backup),backup);
const invalid=[
  {...backup,format:'not-rebecca'},
  {...backup,version:2},
  {...backup,data:{...backup.data,website:{published:{}}}},
  {...backup,data:{...backup.data,concierge:{published:{trustedAnswers:{}}}}},
  {...backup,data:{...backup.data,media:{published:{library:[],placements:[]}}}},
  {...backup,note:'x'.repeat(8*1024*1024)}
];
for(const item of invalid){
  assert.throws(()=>validateBundle(item),error=>error.code==='BACKUP_INVALID');
}
const store=fs.readFileSync(new URL('../lib/system-store.js',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../server/admin/system.js',import.meta.url),'utf8');
assert.match(store,/captureRecoverySnapshot\('Before owner recovery restore'/);
assert.match(store,/failure.code='RESTORE_PARTIAL'/);
assert.match(api,/RESTORE_PARTIAL/);
assert.match(store,/restoreSnapshotToDraft[\s\S]*validateBundle/);
const guide=fs.readFileSync(new URL('../docs/REBECCA_OWNER_HANDBOOK.md',import.meta.url),'utf8');
assert.match(guide,/Lost password/);
assert.match(guide,/Vercel deployment rollback does not roll back database content/);
console.log('RC-QA-06 session rotation, origin defense, backup validation and recovery safeguards passed.');
