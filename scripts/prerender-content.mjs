import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseHTML } from 'linkedom';
import { routeIndex } from '../lib/seo-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: config } = await import(pathToFileURL(configPath).href);
const entry = path.resolve(root, config.prerender?.entry || 'content.js');
const write = process.argv.includes('--write');
const verify = process.argv.includes('--verify');
const eligible = routeIndex(config).filter((route) => {
  if (route.page.generated) return false;
  if (route.page.indexable === false) return false;
  if (!route.searchApproved) return false;
  if (!route.file.endsWith('.html')) return false;
  return !route.file.startsWith('admin');
});

let changed = 0;
let failures = 0;
let counter = 0;

for (const route of eligible) {
  const fullPath = path.join(root, route.file);
  let source;
  try {
    source = await fs.readFile(fullPath, 'utf8');
  } catch {
    console.error(route.file + ': configured prerender page is missing');
    failures += 1;
    continue;
  }

  if (!source.includes('/content.js')) continue;

  let rendered;
  try {
    rendered = await renderPage(source, route.path, ++counter);
  } catch (error) {
    console.error(route.file + ': prerender failed: ' + error.message);
    failures += 1;
    continue;
  }

  const required = config.prerender?.requiredBindingsByPage?.[route.file] || [];
  for (const binding of required) {
    const selector = '[' + binding + ']';
    const { document } = parseHTML(rendered);
    const element = document.querySelector(selector);
    if (!element) {
      console.error(route.file + ': missing required prerender binding ' + binding);
      failures += 1;
      continue;
    }
    if (!String(element.textContent || '').trim() && !element.querySelector('img,input,select,option,a')) {
      console.error(route.file + ': prerender binding remained empty ' + binding);
      failures += 1;
    }
  }

  if (rendered !== source) {
    changed += 1;
    if (write) {
      await fs.writeFile(fullPath, rendered);
      console.log('WRITE ' + route.file);
    } else {
      console.log('CHANGE ' + route.file);
    }
  }
}

if (failures) process.exit(1);

if (verify) {
  console.log('Prerender verification passed for ' + eligible.length + ' approved public route variants.');
} else {
  console.log('Content prerender ' + (write ? 'completed' : 'preview') + ': ' + changed + ' file(s) ' + (write ? 'updated.' : 'would change.'));
}

async function renderPage(source, pathname, id) {
  const { window, document } = parseHTML(source);
  const pageUrl = new URL(pathname, config.deployment.origin);

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      href: pageUrl.href,
      origin: pageUrl.origin,
      pathname: pageUrl.pathname,
      search: '',
      hash: ''
    }
  });

  const storage = memoryStorage();
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    CustomEvent: globalThis.CustomEvent,
    Event: globalThis.Event,
    Node: globalThis.Node,
    HTMLElement: globalThis.HTMLElement,
    sessionStorage: globalThis.sessionStorage,
    localStorage: globalThis.localStorage,
    fetch: globalThis.fetch
  };

  setGlobal('window', window);
  setGlobal('document', document);
  setGlobal('CustomEvent', window.CustomEvent);
  setGlobal('Event', window.Event);
  setGlobal('Node', window.Node);
  setGlobal('HTMLElement', window.HTMLElement);
  setGlobal('sessionStorage', storage);
  setGlobal('localStorage', storage);
  setGlobal('fetch', async () => ({
    ok: false,
    status: 503,
    json: async () => ({})
  }));

  try {
    await import(pathToFileURL(entry).href + '?prerender=' + id);
    document.documentElement.dataset.seoPrerendered = 'true';
    document.documentElement.dataset.seoPrerenderRoute = pathname;
    return '<!doctype html>' + document.documentElement.outerHTML;
  } finally {
    restore('window', previous.window);
    restore('document', previous.document);
    restore('CustomEvent', previous.CustomEvent);
    restore('Event', previous.Event);
    restore('Node', previous.Node);
    restore('HTMLElement', previous.HTMLElement);
    restore('sessionStorage', previous.sessionStorage);
    restore('localStorage', previous.localStorage);
    restore('fetch', previous.fetch);
  }
}

function memoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(String(key)) ? map.get(String(key)) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    }
  };
}

function setGlobal(key, value) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value
  });
}

function restore(key, value) {
  if (value === undefined) delete globalThis[key];
  else globalThis[key] = value;
}
