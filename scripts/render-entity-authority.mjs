import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { routeIndex } from '../lib/seo-engine.mjs';
import {
  entityGraphForRoute,
  injectEntityAuthorityGraph,
  validateEntityAuthority
} from '../lib/entity-authority-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteConfigPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: site } = await import(pathToFileURL(siteConfigPath).href);
const entityConfigPath = path.resolve(
  root,
  site.entityAuthority?.module || 'seo/entity-authority.config.mjs'
);
const { ENTITY_AUTHORITY: authority } = await import(pathToFileURL(entityConfigPath).href);
const write = process.argv.includes('--write');

const validation = validateEntityAuthority(authority);
for (const warning of validation.warnings) console.warn('Entity authority warning: ' + warning);
if (validation.errors.length) {
  for (const error of validation.errors) console.error('Entity authority error: ' + error);
  process.exit(1);
}

let changed = 0;
const targets = routeIndex(site).filter(
  (route) => route.searchApproved && authority.pageMap[route.page.id]
);

for (const route of targets) {
  const file = path.join(root, route.file);
  let current;
  try {
    current = await fs.readFile(file, 'utf8');
  } catch {
    console.error('Entity authority target missing: ' + route.file);
    process.exitCode = 1;
    continue;
  }

  const graph = entityGraphForRoute(site, authority, route);
  const next = injectEntityAuthorityGraph(current, graph);
  if (next === current) continue;

  changed += 1;
  console.log((write ? 'WRITE ' : 'CHANGE ') + route.file);
  if (write) await fs.writeFile(file, next);
}

if (process.exitCode) process.exit(process.exitCode);

console.log(
  'Entity authority render ' + (write ? 'completed' : 'preview') + ': ' +
  changed + ' file(s) ' + (write ? 'updated.' : 'would change.')
);
