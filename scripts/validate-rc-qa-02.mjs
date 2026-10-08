import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseHTML } from 'linkedom';

const source = fs.readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../admin.css', import.meta.url), 'utf8');
const { document } = parseHTML(html);

const labels = ['Home','Website','Photos','Concierge','Growth','Settings'];
const areas = [...document.querySelectorAll('[data-control-area]')];
assert.deepEqual(areas.map(x => x.textContent.trim()), labels);
assert.equal(new Set(areas.map(x => x.dataset.controlArea)).size, 6);

const tabs = [...document.querySelectorAll('[data-tab]')];
const subTabs = [...document.querySelectorAll('[data-subnav] [data-tab]')];
const panels = [...document.querySelectorAll('[data-panel]')];
assert.equal(tabs.length, 17);
assert.equal(subTabs.length, 16);
assert.equal(new Set(tabs.map(x => x.dataset.tab)).size, 17);
assert.deepEqual(tabs.map(x => x.dataset.tab).sort(), panels.map(x => x.dataset.panel).sort());
assert.equal(document.querySelectorAll('[data-tab="assistant"]').length, 1, 'Ask Control is a launcher, not a duplicated nav tab');
assert.equal(document.querySelectorAll('[data-assistant-back]').length, 1);

const expected = {
  home: ['insights'],
  website: ['availability','travel','live','schedule','rates','contact','profile'],
  photos: ['media'],
  concierge: ['concierge','concierge-test','needs-rebecca'],
  growth: ['search'],
  settings: ['settings','history','export']
};
for (const [area, ids] of Object.entries(expected)) {
  assert.deepEqual(subTabs.filter(x => x.dataset.area === area).map(x => x.dataset.tab), ids);
}

const d = source.indexOf('const AREA_DETAILS = {');
const dEnd = source.indexOf('let mediaState =', d);
const navStart = source.indexOf('function areaOfTab(name) {');
const navEnd = source.indexOf('function renderAvailability()', navStart);
assert.ok(d >= 0 && dEnd > d && navStart > d && navEnd > navStart, 'Navigation source boundaries must remain valid');

const hits = { media:0, concierge:0, needs:0, system:0, insights:0 };
const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
};
const functionBody = [
  "let activeTab = 'insights';",
  "let lastRegularTab = 'insights';",
  "const lastTabsByArea = Object.create(null);",
  "let mediaLoaded = false, conciergeLoaded = false, needsLoaded = false, systemLoaded = false, insightsLoaded = false;",
  source.slice(d,dEnd),
  source.slice(navStart,navEnd),
  "return { activateTab, activateArea, active: () => activeTab, previous: () => lastRegularTab };"
].join('\n');
const createNavigation = new Function('document','setText','quickSavebar','loadMedia','loadConcierge','loadNeedsRebecca','loadSystem','loadInsights', functionBody);
const ui = createNavigation(document,setText,document.querySelector('[data-quick-savebar]'),
  () => hits.media++, () => hits.concierge++, () => hits.needs++, () => hits.system++, () => hits.insights++
);
const activeArea = () => document.querySelector('[data-control-area].is-active')?.dataset.controlArea;
const visiblePanels = () => [...document.querySelectorAll('[data-panel].is-active')].map(x => x.dataset.panel);
const selectedTabs = () => [...document.querySelectorAll('[data-subnav] [data-tab].is-active')].map(x=>x.dataset.tab);

ui.activateTab('insights');
assert.equal(activeArea(),'home');
assert.deepEqual(visiblePanels(),['insights']);
assert.equal(document.querySelector('[data-subnav]').hidden,true);

ui.activateArea('website');
assert.equal(ui.active(),'availability');
assert.equal(activeArea(),'website');
assert.equal(document.querySelector('[data-subnav]').hidden,false);
assert.deepEqual(selectedTabs(),['availability']);

ui.activateTab('rates');
assert.deepEqual(visiblePanels(),['rates']);
ui.activateArea('photos');
assert.equal(activeArea(),'photos');
assert.deepEqual(visiblePanels(),['media']);
assert.equal(document.querySelector('[data-subnav]').hidden,true);

ui.activateArea('website');
assert.equal(ui.active(),'rates','Switching back to Website remembers the last chosen subtab');
ui.activateTab('needs-rebecca');
assert.equal(activeArea(),'concierge');
assert.deepEqual(visiblePanels(),['needs-rebecca']);
assert.equal(document.querySelector('[data-subnav]').hidden,false);
ui.activateTab('assistant');
assert.deepEqual(visiblePanels(),['assistant']);
assert.equal(ui.previous(),'needs-rebecca');
assert.equal(document.querySelector('[data-subnav]').hidden,true);
ui.activateTab(ui.previous());
assert.equal(ui.active(),'needs-rebecca');

ui.activateTab('search');
assert.equal(activeArea(),'growth');
assert.deepEqual(visiblePanels(),['search']);
ui.activateTab('export');
assert.equal(activeArea(),'settings');
assert.deepEqual(visiblePanels(),['export']);
ui.activateTab('not-a-real-tab');
assert.equal(ui.active(),'insights');

assert.ok(hits.media >= 1 && hits.needs >= 1 && hits.system >= 1 && hits.insights >= 1, 'Existing lazy-loading hooks are retained');
assert.match(source, /if \(Object\.hasOwn\(AREA_DETAILS, activeTab\)\)/, 'Area shortcut deep links are supported');
assert.match(source, /activateTab\(tab\.dataset\.tab\)/, 'Existing tab click routing remains');
assert.match(source, /activateArea\(areaButton\.dataset\.controlArea\)/);
assert.match(html, /option value="search">Search Intelligence/);
assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css, /max-width:480px/);

console.log('RC-QA-02 six areas, all 17 features, old routes, switching, assistant return and responsive styles validated.');
