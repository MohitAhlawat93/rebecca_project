import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderCountryHub, renderMicroHub, validateGeoAuthority } from '../lib/geo-authority-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteConfigPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: site } = await import(pathToFileURL(siteConfigPath).href);
const geoConfigPath = path.resolve(root, site.geoAuthority?.module || 'seo/geo-hubs.config.mjs');
const { GEO_AUTHORITY: geo } = await import(pathToFileURL(geoConfigPath).href);
const write = process.argv.includes('--write');

const validation = validateGeoAuthority(geo);
for (const warning of validation.warnings) console.warn('Geo authority warning: ' + warning);
if (validation.errors.length) {
  for (const error of validation.errors) console.error('Geo authority error: ' + error);
  process.exit(1);
}

const outputs = [
  {
    file: path.join(root, geo.country.slug, 'index.html'),
    content: renderCountryHub(site, geo)
  },
  ...geo.hubs.map((hub) => ({
    file: path.join(root, geo.country.slug, hub.slug + '.html'),
    content: renderMicroHub(site, geo, hub)
  }))
];

let changed = 0;
for (const output of outputs) {
  let current = '';
  try {
    current = await fs.readFile(output.file, 'utf8');
  } catch {
    // Generated file does not exist yet.
  }
  if (current === output.content) continue;
  changed += 1;
  console.log((write ? 'WRITE ' : 'CHANGE ') + path.relative(root, output.file));
  if (write) {
    await fs.mkdir(path.dirname(output.file), { recursive: true });
    await fs.writeFile(output.file, output.content);
  }
}

console.log(
  'Geo authority generation ' + (write ? 'completed' : 'preview') + ': ' +
  changed + ' file(s) ' + (write ? 'updated.' : 'would change.')
);
