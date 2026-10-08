import { test, expect } from '@playwright/test';
import { createMockAdmin } from './mock-api.mjs';

async function fixture(page, options={authenticated:true}) {
  const mock=createMockAdmin(options);
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.route('**/*', async route=>{
    const url=new URL(route.request().url());
    if (url.hostname==='esm.sh') return route.fulfill({
      status:200,contentType:'text/javascript',body:"export async function upload(){throw new Error('Browser fixture cannot upload files.');}"
    });
    if (url.hostname!=='127.0.0.1' || url.port!=='4179') return route.abort('blockedbyclient');
    if (url.pathname.startsWith('/api/admin/')) return mock.handle(route);
    return route.continue();
  });
  return {...mock,errors};
}

async function open(page,path='/admin') {
  await page.goto(path);
  await expect(page.locator('[data-app-view]')).toBeVisible();
  await expect(page.locator('[data-login-view]')).toBeHidden();
}

test('owner authentication blocks unauthenticated dashboard and bad passwords', async ({page})=>{
  const {api,errors}=await fixture(page,{authenticated:false});
  await page.goto('/admin');
  await expect(page.locator('[data-login-view]')).toBeVisible();
  await expect(page.locator('[data-app-view]')).toBeHidden();
  await page.locator('[name="loginId"]').fill('demo-owner');
  await page.locator('[name="password"]').fill('wrong-password');
  await page.locator('[data-login-form] button[type="submit"]').click();
  await expect(page.locator('[data-login-message]')).toContainText('Invalid owner credentials');
  await expect(page.locator('[data-app-view]')).toBeHidden();
  await page.locator('[name="password"]').fill('test-only-password');
  await page.locator('[data-login-form] button[type="submit"]').click();
  await expect(page.locator('[data-app-view]')).toBeVisible();
  await expect(page.locator('[data-login-view]')).toBeHidden();
  expect(api.count('POST','/api/admin/login')).toBe(2);
  expect(api.count('PUT','/api/admin/quick-control')).toBe(0);
  expect(errors).toEqual([]);
});

test('six areas, old deep links, onboarding, Ask Control and responsive navigation work', async ({page})=>{
  const {errors}=await fixture(page);
  await open(page,'/admin?tab=rates');
  await expect(page.locator('[data-panel="rates"]')).toBeVisible();
  await expect(page.locator('[data-control-area="website"]')).toHaveClass(/is-active/);
  await expect(page.locator('[data-owner-onboarding]')).toBeVisible();
  await page.locator('[data-guide-dismiss]').first().click();
  await expect(page.locator('[data-owner-onboarding]')).toBeHidden();
  await page.locator('[data-guide-reopen]').click();
  await expect(page.locator('[data-owner-onboarding]')).toBeVisible();
  await page.locator('[data-guide-dismiss]').first().click();

  for(const area of ['home','website','photos','concierge','growth','settings']){
    await page.locator('[data-control-area="'+area+'"]').click();
    await expect(page.locator('[data-control-area="'+area+'"]')).toHaveClass(/is-active/);
    const current=await page.locator('[data-panel].is-active').count();
    expect(current).toBe(1);
  }
  await page.locator('[data-control-area="website"]').click();
  await page.locator('[data-tab="rates"]').click();
  await page.locator('[data-tab="assistant"]').click();
  await expect(page.locator('[data-panel="assistant"]')).toBeVisible();
  await page.locator('[data-assistant-back]').click();
  await expect(page.locator('[data-panel="rates"]')).toBeVisible();

  for(const area of ['home','website','photos','concierge','growth','settings']){
    const box=await page.locator('[data-control-area="'+area+'"]').boundingBox();
    const width=await page.evaluate(()=>window.innerWidth);
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x+box.width).toBeLessThanOrEqual(width+1);
  }
  expect(errors).toEqual([]);
});

test('Publishing Center is read-only and routes into the original editors',async({page})=>{
  const {api,errors}=await fixture(page,{authenticated:true,visualDraftPending:true,aiDraftPending:true});
  await open(page,'/admin?tab=publishing');
  await expect(page.locator('[data-pub-draft-count]')).toHaveText('2');
  await expect(page.locator('[data-pub-status="websiteDraft"]')).toHaveText('Private Draft');
  await expect(page.locator('[data-pub-status="concierge"]')).toHaveText('Private Draft');
  await page.locator('[data-publishing-refresh]').click();
  await expect(page.locator('[data-publishing-feedback]')).toContainText('Up to date');
  const before=api.requests.filter(x=>['PUT','POST'].includes(x.method)).length;
  await page.locator('[data-publishing-tab="media"]').click();
  await expect(page.locator('[data-panel="media"]')).toBeVisible();
  const after=api.requests.filter(x=>['PUT','POST'].includes(x.method)).length;
  expect(after).toBe(before);
  expect(errors).toEqual([]);
});

test('Website Save & apply uses expected version and changes only the mock store',async({page})=>{
  const {api,errors}=await fixture(page);
  await open(page,'/admin?tab=availability');
  await page.locator('[data-availability-message]').fill('Fixture availability text — not real');
  await expect(page.locator('[data-save]')).toBeEnabled();
  await page.locator('[data-save]').click();
  await expect(page.locator('[data-save-state]')).toHaveText('All changes saved');
  expect(api.count('PUT','/api/admin/quick-control')).toBe(1);
  const call=api.requests.find(x=>x.method==='PUT'&&x.path==='/api/admin/quick-control');
  expect(call.body.expectedVersion).toBe(3);
  expect(api.quick.availability.message).toBe('Fixture availability text — not real');
  expect(errors).toEqual([]);
});

test('conflicting Website Draft does not overwrite changes and warns owner',async({page})=>{
  const {api}=await fixture(page,{authenticated:true,visualDraftPending:true});
  await open(page,'/admin?tab=availability');
  await expect(page.locator('[data-visual-draft-banner]')).toBeVisible();
  await page.locator('[data-availability-message]').fill('Keep this fixture change safely');
  await expect(page.locator('[data-save]')).toBeDisabled();
  expect(api.count('PUT','/api/admin/quick-control')).toBe(0);
});

test('stale Quick Control write fails without clearing unsaved text',async({page})=>{
  const {api}=await fixture(page,{authenticated:true,quickConflict:true});
  await open(page,'/admin?tab=availability');
  await page.locator('[data-availability-message]').fill('Unsaved fixture wording');
  await page.locator('[data-save]').click();
  await expect(page.locator('[data-save-state]')).toHaveText('Not saved');
  await expect(page.locator('[data-save-detail]')).toContainText('Your edits remain on this screen');
  await expect(page.locator('[data-availability-message]')).toHaveValue('Unsaved fixture wording');
  expect(api.count('PUT','/api/admin/quick-control')).toBe(1);
  expect(api.quick.availability.message).not.toBe('Unsaved fixture wording');
});

test('Photos: edit, save Draft, confirmation-gated Publish',async({page})=>{
  const {api,errors}=await fixture(page);
  await open(page,'/admin?tab=media');
  await expect(page.locator('[data-media-connection]')).toHaveText('Connected');
  await page.locator('.rc-media-thumb[data-media-toggle="p2"]').click();
  await expect(page.locator('[data-media-save-draft]')).toBeEnabled();
  await page.locator('[data-media-save-draft]').click();
  await expect(page.locator('[data-media-draft-status]')).toHaveText('Saved draft');
  expect(api.count('PUT','/api/admin/media')).toBe(1);
  expect(api.count('POST','/api/admin/media')).toBe(0);
  page.once('dialog', d=>d.dismiss());
  await page.locator('[data-media-publish]').click();
  await expect(page.locator('[data-media-publish]')).toBeEnabled();
  expect(api.count('POST','/api/admin/media')).toBe(0);
  page.once('dialog', d=>d.accept());
  await page.locator('[data-media-publish]').click();
  await expect(page.locator('[data-media-draft-status]')).toHaveText('Matches live');
  expect(api.count('POST','/api/admin/media')).toBe(1);
  expect(JSON.stringify(api.photoLive)).toEqual(JSON.stringify(api.photoDraft));
  expect(errors).toEqual([]);
});

test('scheduled media blocks manual publish controls',async({page})=>{
  const {api}=await fixture(page,{authenticated:true,mediaSchedule:{
    publishAt:'2026-10-11T08:00:00Z',expireAt:'2026-10-12T08:00:00Z',
    publishLocal:'2026-10-11T16:00',expireLocal:'2026-10-12T16:00',
    state:{library:[],placements:{}},fallbackState:{library:[],placements:{}},fallbackPublishedVersion:1
  }});
  await open(page,'/admin?tab=media');
  await expect(page.locator('[data-media-schedule-phase]')).toContainText('Scheduled');
  await expect(page.locator('[data-media-publish]')).toBeDisabled();
  expect(api.count('POST','/api/admin/media')).toBe(0);
});

test('AI concierge saves to private Draft, tests, then publishes only on confirmation',async({page})=>{
  const {api,errors}=await fixture(page);
  await open(page,'/admin?tab=concierge');
  await expect(page.locator('[data-concierge-connection]')).toHaveText('Connected');
  await page.locator('[data-concierge-field="welcome"]').fill('Fixture only — welcome');
  await page.locator('[data-concierge-save]').click();
  await expect(page.locator('[data-concierge-draft-status]')).toHaveText('Ahead of live');
  expect(api.count('PUT','/api/admin/concierge-control')).toBe(1);
  expect(api.aiLive.welcome).not.toBe('Fixture only — welcome');

  await page.locator('[data-tab="concierge-test"]').click();
  await page.locator('[data-concierge-test-input]').fill('What is in the saved Draft?');
  await page.locator('[data-concierge-test-send]').click();
  await expect(page.locator('[data-concierge-test-note]')).toContainText('Nothing was published');
  expect(api.count('POST','/api/admin/concierge-test')).toBe(1);
  expect(api.count('POST','/api/admin/concierge-control')).toBe(0);

  await page.locator('[data-tab="concierge"]').click();
  page.once('dialog', d=>d.accept());
  await page.locator('[data-concierge-publish]').click();
  await expect(page.locator('[data-concierge-save-state]')).toContainText('Concierge published');
  expect(api.count('POST','/api/admin/concierge-control')).toBe(1);
  expect(api.aiLive.welcome).toBe('Fixture only — welcome');
  expect(errors).toEqual([]);
});

test('recovery point stays Draft-only and requires explicit confirmation',async({page})=>{
  const {api,errors}=await fixture(page);
  await open(page,'/admin?tab=history');
  await expect(page.locator('[data-system-snapshot-count]')).toHaveText('1');
  await expect(page.locator('[data-system-restore="fixture-point"]')).toBeVisible();
  page.once('dialog', d=>d.dismiss());
  await page.locator('[data-system-restore="fixture-point"]').click();
  expect(api.count('POST','/api/admin/system')).toBe(0);
  await page.locator('[data-tab="export"]').click();
  await expect(page.locator('[data-panel="export"]')).toContainText('Nothing goes live automatically');
  expect(errors).toEqual([]);
});

test('logout hides private workspace',async({page})=>{
  const {api}=await fixture(page);
  await open(page);
  await page.locator('[data-logout]').click();
  await expect(page.locator('[data-app-view]')).toBeHidden();
  await expect(page.locator('[data-login-view]')).toBeVisible();
  expect(api.authenticated).toBe(false);
  expect(api.count('POST','/api/admin/logout')).toBe(1);
});

test('launch readiness is read-only, remains unsigned and does not preserve local checkmarks',async({page})=>{
  const {api,errors}=await fixture(page);
  await open(page,'/admin?tab=launch');
  await expect(page.locator('[data-panel="launch"]')).toBeVisible();
  await expect(page.locator('[data-launch-decision]')).toHaveText('NOT SIGNED OFF');
  await expect(page.locator('[data-launch-check]')).toHaveCount(6);
  await expect(page.locator('[data-launch-pass]')).toHaveText('3');
  await expect(page.locator('[data-launch-open]')).toHaveText('3');
  await expect(page.locator('[data-launch-accept]')).toHaveCount(7);
  expect(api.count('PUT','/api/admin/launch-readiness')).toBe(0);
  expect(api.count('POST','/api/admin/launch-readiness')).toBe(0);
  await page.locator('[data-launch-accept]').first().check();
  await expect(page.locator('[data-launch-owner-progress]')).toContainText('1 of 7');
  await expect(page.locator('[data-launch-decision]')).toHaveText('NOT SIGNED OFF');
  await page.locator('[data-launch-refresh]').click();
  await expect(page.locator('[data-launch-check]')).toHaveCount(6);
  await page.locator('[data-launch-reset]').click();
  await expect(page.locator('[data-launch-owner-progress]')).toContainText('0 of 7');
  expect(await page.locator('[data-launch-accept]:checked').count()).toBe(0);
  expect(api.count('POST','/api/admin/system')).toBe(0);
  await page.reload();
  await expect(page.locator('[data-panel="launch"]')).toBeVisible();
  expect(await page.locator('[data-launch-accept]:checked').count()).toBe(0);
  await expect(page.locator('[data-launch-decision]')).toHaveText('NOT SIGNED OFF');
  expect(errors).toEqual([]);
});
