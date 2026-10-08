import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseHTML } from 'linkedom';
import { summarizePublishingStates } from '../lib/publishing-overview.js';
import { buildDefaultMediaState } from '../lib/media-store.js';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const html = read('../admin.html');
const client = read('../admin-publishing.js');
const server = read('../server/admin/publishing-overview.js');
const router = read('../api/admin/[route].js');
const guide = read('../admin-guide.js');
const css = read('../admin.css');
const pkg = JSON.parse(read('../package.json'));
const { document } = parseHTML(html);

assert.match(server, /getAdminSession\(req\)/);
assert.match(server, /req.method !== 'GET'/);
assert.match(server, /private, no-store/);
assert.match(server, /noindex, nofollow, noarchive/);
assert.match(router, /'publishing-overview': publishingOverview/);
assert.match(client, /credentials: 'same-origin'/);
assert.match(client, /cache: 'no-store'/);
assert.match(client, /rc:admin-tab/);
assert.doesNotMatch(client, /method: 'POST'|method: 'PUT'|action: 'publish'/);

const tab = document.querySelector('[data-subnav] [data-tab="publishing"]');
assert.equal(tab?.dataset.area, 'website');
assert.equal(document.querySelectorAll('[data-panel="publishing"]').length, 1);
assert.equal(document.querySelectorAll('[data-publishing-card]').length, 4);
assert.equal(document.querySelectorAll('[data-publishing-refresh]').length, 1);
assert.equal(document.querySelectorAll('[data-publishing-tab]').length >= 6, true);
const original = new Set([...document.querySelectorAll('[data-subnav] [data-tab]')].map(b=>b.dataset.tab));
for (const b of [...document.querySelectorAll('[data-publishing-tab]')])
  assert.ok(original.has(b.dataset.publishingTab), 'Invalid editor destination '+b.dataset.publishingTab);
assert.match(html,/Long-form homepage editorial paragraphs/);
assert.match(guide,/publishing: \{/);
assert.match(css,/@media\(max-width:420px\)/);
assert.equal(Boolean(pkg.scripts?.['validate:rc-qa-04']),true);

const now = new Date('2026-10-08T09:00:00.000Z');
const baseMedia = buildDefaultMediaState();
const media = {
  persistent:true, draft:structuredClone(baseMedia), published:structuredClone(baseMedia),
  version:2,publishedVersion:1,publishedAt:'2026-10-01T04:00:00Z',updatedAt:'2026-10-07T04:00:00Z',schedule:null
};
const website = {persistent:true,hasDraftChanges:true,version:4,updatedAt:'2026-10-08T07:00:00Z'};
const concierge = {persistent:true,hasDraftChanges:true,publishedVersion:3,publishedAt:'2026-10-07T07:00:00Z'};
let status = summarizePublishingStates({website,media,concierge}, now);
assert.equal(status.overview.connectedCount,3);
assert.equal(status.overview.savedDraftsWaiting,2);
assert.equal(status.websiteDraft.status,'draft');
assert.equal(status.websiteFacts.status,'live');
assert.equal(status.photos.status,'current');
assert.equal(status.concierge.status,'draft');
assert.ok(!JSON.stringify(status).includes('trustedAnswers'), 'No sensitive content sent to client');

media.draft = structuredClone(baseMedia);
media.draft.placements.hero = [];
if (JSON.stringify(media.draft) === JSON.stringify(media.published)) media.draft.library.push({id:'test'});
status = summarizePublishingStates({website,media,concierge},now);
assert.equal(status.overview.savedDraftsWaiting,3);
assert.equal(status.photos.status,'draft');

media.schedule = {
  id:'media-test',publishAt:'2026-10-10T08:00:00Z',expireAt:'2026-10-12T08:00:00Z',
  state:structuredClone(media.draft),fallbackState:structuredClone(media.published),fallbackPublishedVersion:1
};
status = summarizePublishingStates({website,media,concierge}, now);
assert.equal(status.photos.schedule,'pending');
assert.equal(status.photos.scheduledPublishAt,'2026-10-10T08:00:00Z');
status = summarizePublishingStates({website,media,concierge}, new Date('2026-10-11T08:00:00Z'));
assert.equal(status.photos.schedule,'active');
status = summarizePublishingStates({website,media,concierge}, new Date('2026-10-13T08:00:00Z'));
assert.equal(status.photos.schedule,'expired');

status = summarizePublishingStates({website:null,media:{persistent:false},concierge},now);
assert.equal(status.overview.connectedCount,1);
assert.equal(status.overview.savedDraftsWaiting,1);
assert.equal(status.overview.allConnected,false);
assert.equal(status.websiteFacts.status,'unavailable');
assert.equal(status.photos.schedule,'unknown');
assert.ok(!('draft' in status), 'Fallback must not expose misleading content');

// Execute the browser-side formatter and card renderer against a DOM fixture.
const window = {};
const launch = new Function('document','window','fetch',client+'\nreturn {render:rcPublishingRender,card:rcPublishingCard};');
const ui = launch(document,window,async()=>({ok:false,status:401,json:async()=>({})}));
ui.render(summarizePublishingStates({website,media,concierge},now));
assert.equal(document.querySelector('[data-pub-draft-count]').textContent,'3');
assert.equal(document.querySelector('[data-pub-status="websiteDraft"]').textContent,'Private Draft');
assert.equal(document.querySelector('[data-pub-status="photos"]').textContent,'Private Draft');
assert.match(document.querySelector('[data-pub-detail="photos"]').textContent,/scheduled/);
assert.equal(document.querySelector('[data-pub-connected]').textContent,'3');
ui.render(null);
assert.equal(document.querySelector('[data-pub-status="websiteFacts"]').textContent,'Unavailable');
assert.match(document.querySelector('[data-publishing-feedback]').textContent,/unavailable/);

console.log('RC-QA-04 protected API, four statuses, schedule lifecycles, failures and responsive publishing view passed.');
