import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderTravelMarket, validateTravelAuthority } from '../lib/travel-authority-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteConfigPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: site } = await import(pathToFileURL(siteConfigPath).href);
const travelConfigPath = path.resolve(root, site.travelAuthority?.module || 'seo/travel-authority.config.mjs');
const module = await import(pathToFileURL(travelConfigPath).href);
const authority = module.TRAVEL_AUTHORITY;
const getEvidence = module.travelEvidenceFor;
const write = process.argv.includes('--write');

const validation = validateTravelAuthority(authority, getEvidence);
for (const warning of validation.warnings) console.warn('Travel authority warning: ' + warning);
if (validation.errors.length) {
  for (const error of validation.errors) console.error('Travel authority error: ' + error);
  process.exit(1);
}

let changed = 0;
for (const market of authority.markets) {
  const output = path.join(root, 'travel', market.slug + '.html');
  const next = renderTravelMarket(site, authority, market, getEvidence(market));
  let current = '';
  try {
    current = await fs.readFile(output, 'utf8');
  } catch {
    // Build output does not exist yet.
  }

  if (current === next) continue;
  changed += 1;
  console.log((write ? 'WRITE ' : 'CHANGE ') + path.relative(root, output));
  if (write) {
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, next);
  }
}

console.log(
  'Travel authority generation ' + (write ? 'completed' : 'preview') + ': ' +
  changed + ' file(s) ' + (write ? 'updated.' : 'would change.')
);
