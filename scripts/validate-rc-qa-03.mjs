import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseHTML } from 'linkedom';

const html = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const guideCode = fs.readFileSync(new URL('../admin-guide.js', import.meta.url), 'utf8');
const admin = fs.readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../admin.css', import.meta.url), 'utf8');
const { document } = parseHTML(html);

assert.match(html, /<script src="\/admin-guide\.js" defer><\/script>/);
assert.ok(html.indexOf('/admin-guide.js') < html.indexOf('/admin.js'), 'Guide must register before session startup');
assert.equal(document.querySelectorAll('[data-guide-reopen]').length, 1);
assert.equal(document.querySelectorAll('[data-owner-onboarding]').length, 1);
assert.equal(document.querySelectorAll('[data-owner-guidance]').length, 1);
assert.equal(document.querySelectorAll('[data-guidance-toggle]').length, 1);
assert.equal(document.querySelectorAll('[data-guide-jump]').length, 3);
assert.equal(document.querySelector('[data-save-detail]').getAttribute('aria-live'), 'polite');
assert.match(admin, /new CustomEvent\('rc:admin-tab'/);
assert.match(admin, /new Event\('rc:admin-ready'\)/);
assert.match(admin, /Your edits remain on this screen/);
assert.match(admin, /Too many sign-in attempts/);
assert.match(css, /rc-owner-welcome/);
assert.match(css, /rc-owner-guidance/);
assert.match(css, /@media\(max-width:700px\)/);

const values = new Map();
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key,value) => values.set(key, value)
};
const window = { localStorage: storage };
const expression = '\nreturn {help:RC_OWNER_HELP,show:rcShowOwnerWelcome,dismiss:rcDismissOwnerWelcome,render:rcRenderOwnerHelp,collapsed:rcSetOwnerHelpCollapsed};';
const run = new Function('document','window', guideCode + expression);
const guide = run(document, window);

const panel = document.querySelector('[data-owner-onboarding]');
const help = document.querySelector('[data-owner-guidance]');
const body = document.querySelector('[data-guidance-body]');
const button = document.querySelector('[data-guidance-toggle]');
const title = document.querySelector('[data-guidance-title]');
const preview = document.querySelector('[data-guidance-preview]');

guide.show();
assert.equal(panel.hidden, false, 'Guide should appear for a first-time browser');
guide.dismiss();
assert.equal(panel.hidden, true);
assert.equal(values.get('rc-owner-guide-seen-v1'), '1');
guide.show();
assert.equal(panel.hidden, true, 'Guide stays dismissed on subsequent sessions');
guide.show(true);
assert.equal(panel.hidden, false, 'Help & guide can reopen at any time');

const requiredTabs = [
  'insights','availability','travel','live','schedule','rates','contact','profile',
  'media','concierge','concierge-test','needs-rebecca','assistant','search','settings','history','export'
];
assert.deepEqual(Object.keys(guide.help).sort(), requiredTabs.sort());
for (const name of requiredTabs) {
  guide.render(name);
  assert.equal(help.hidden, false);
  assert.ok(title.textContent.length > 8, 'Missing title for ' + name);
  assert.ok(document.querySelector('[data-guidance-summary]').textContent.length > 20, 'Missing summary for ' + name);
  assert.ok(document.querySelectorAll('[data-guidance-steps] li').length >= 2, 'Missing practical steps for ' + name);
  assert.ok(document.querySelector('[data-guidance-publishing]').textContent.includes('Draft & publishing:'));
  assert.ok(document.querySelector('[data-guidance-caution]').textContent.includes('Remember:'));
  if (guide.help[name].preview) {
    assert.equal(preview.hidden, false);
    assert.ok(guide.help[name].preview.startsWith('/') && !guide.help[name].preview.startsWith('//'), 'Preview must be local');
  } else {
    assert.equal(preview.hidden, true);
  }
}

guide.render('media');
assert.match(document.querySelector('[data-guidance-publishing]').textContent, /Save Draft is private/);
guide.render('assistant');
assert.match(document.querySelector('[data-guidance-publishing]').textContent, /cannot silently publish/);
guide.render('export');
assert.match(document.querySelector('[data-guidance-publishing]').textContent, /private Drafts/);
guide.render('availability');
assert.match(document.querySelector('[data-guidance-publishing]').textContent, /live website/);

guide.collapsed(true);
assert.equal(body.hidden, true);
assert.equal(button.getAttribute('aria-expanded'),'false');
assert.equal(values.get('rc-owner-help-collapsed-v1'),'1');
guide.render('rates');
assert.equal(body.hidden, true, 'Help stays collapsed while navigating');
guide.collapsed(false);
assert.equal(body.hidden, false);
assert.equal(button.getAttribute('aria-expanded'),'true');
assert.equal(values.get('rc-owner-help-collapsed-v1'),'0');
guide.render('not-a-real-section');
assert.equal(title.textContent, guide.help.insights.title);

console.log('RC-QA-03 onboarding, all 17 guides, preview boundaries and Draft/Publish coaching passed.');
