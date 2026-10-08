import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseHTML } from 'linkedom';
import { summarizeLaunchReadiness } from '../lib/launch-readiness.js';

const read = path => fs.readFileSync(new URL(path,import.meta.url),'utf8');
const html=read('../admin.html');
const script=read('../admin-launch.js');
const api=read('../server/admin/launch-readiness.js');
const router=read('../api/admin/[route].js');
const css=read('../admin.css');
const {document}=parseHTML(html);

assert.match(api,/getAdminSession\(req\)/);
assert.match(api,/req.method!=='GET'/);
assert.match(api,/private, no-store/);
assert.match(router,/'launch-readiness': launchReadiness/);
assert.match(script,/credentials:'same-origin'/);
assert.match(script,/method:'GET'/);
assert.doesNotMatch(script,/method:'POST'|method:'PUT'|action:'publish'/);

assert.equal(document.querySelector('[data-tab="launch"]').dataset.area,'settings');
assert.equal(document.querySelectorAll('[data-panel="launch"]').length,1);
assert.equal(document.querySelectorAll('[data-launch-accept]').length,7);
assert.ok(document.querySelector('[data-launch-copy]'));
assert.ok(document.querySelector('[data-launch-refresh]'));
assert.match(html,/not saved approval or proof/i);
assert.match(css,/@media\(max-width:420px\)/);
const now=new Date('2026-10-08T12:00:00Z');
const complete=summarizeLaunchReadiness({
  publishing:{overview:{connectedCount:3}},
  system:{persistent:true,snapshots:[{id:'fixture-only'}]},
  aiConfigured:true
},now);
assert.equal(complete.decision,'NOT_SIGNED_OFF');
assert.equal(complete.launchAuthorized,false);
assert.equal(complete.summary.passed,3);
assert.equal(complete.summary.pending,3);
assert.equal(complete.summary.blocked,0);
assert.equal(complete.checks.length,6);
assert.equal(complete.generatedAt,now.toISOString());
assert.ok(!JSON.stringify(complete).includes('fixture-only'),'Recovery payload must not leave server');
const failed=summarizeLaunchReadiness({
  publishing:{overview:{connectedCount:0}},system:{persistent:false,snapshots:[]},aiConfigured:false
},now);
assert.equal(failed.summary.blocked,3);
assert.equal(failed.launchAuthorized,false);
assert.equal(failed.summary.passed,0);
const mixed=summarizeLaunchReadiness({publishing:null,system:null,aiConfigured:true},now);
assert.equal(mixed.summary.blocked,2);
assert.equal(mixed.decision,'NOT_SIGNED_OFF');
// Exercise real panel renderer using the same safe DOM fixture as the admin.
const run=new Function('document','navigator','fetch',script+'\nreturn {render:launchRender,unavailable:launchUnavailable};');
const app=run(document,{},()=>Promise.reject(new Error('Offline fixture')));
app.render(complete);
assert.equal(document.querySelector('[data-launch-checks]').children.length,6);
assert.equal(document.querySelectorAll('[data-launch-check]').length,6,'Launch cards must expose the selector consumed by review notes');
assert.equal(document.querySelector('[data-launch-decision]').textContent,'NOT SIGNED OFF');
assert.equal(document.querySelector('[data-launch-pass]').textContent,'3');
assert.equal(document.querySelector('[data-launch-open]').textContent,'3');
app.unavailable('Status unavailable');
assert.equal(document.querySelector('[data-launch-checks]').children.length,0);
assert.match(document.querySelector('[data-launch-feedback]').textContent,/unavailable/i);
assert.match(read('../docs/RC-QA-07-LAUNCH-ACCEPTANCE.md'),/DO NOT SWITCH DOMAIN/);
console.log('RC-QA-07 owner-only launch gate, blockers, privacy and unapproved signoff checks passed.');
