import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateGeoAuthority } from '../lib/geo-authority-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteConfigPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: site } = await import(pathToFileURL(siteConfigPath).href);
const geoConfigPath = path.resolve(root, site.geoAuthority?.module || 'seo/geo-hubs.config.mjs');
const { GEO_AUTHORITY: geo } = await import(pathToFileURL(geoConfigPath).href);
const rendered = process.env.GEO_VALIDATE_RENDERED === 'true';

const validation = validateGeoAuthority(geo);
const errors = [...validation.errors];
for (const warning of validation.warnings) console.warn('Geo authority warning: ' + warning);

if (rendered) {
  const expected = [
    { path: geo.country.path, file: path.join(root, geo.country.slug, 'index.html') },
    ...geo.hubs.map((hub) => ({
      path: geo.country.path + '/' + hub.slug,
      file: path.join(root, geo.country.slug, hub.slug + '.html')
    }))
  ];

  for (const item of expected) {
    let html = '';
    try {
      html = await fs.readFile(item.file, 'utf8');
    } catch {
      errors.push('Missing generated geo page: ' + path.relative(root, item.file));
      continue;
    }
    if (!html.includes('<main')) errors.push(item.path + ': missing main content.');
    if (!html.includes('BreadcrumbList')) errors.push(item.path + ': missing BreadcrumbList schema.');
    if (!html.includes('class="geo-breadcrumb"')) errors.push(item.path + ': missing visible breadcrumb.');
    if (!html.includes('<link rel="canonical"')) errors.push(item.path + ': missing canonical.');
  }

  const parent = await fs.readFile(path.join(root, geo.country.slug, 'index.html'), 'utf8');
  for (const hub of geo.hubs) {
    const href = geo.country.path + '/' + hub.slug;
    if (!parent.includes('href="' + href + '"')) errors.push('Country hub does not link to ' + href);
  }
}

if (errors.length) {
  for (const error of errors) console.error('Geo authority validation failed: ' + error);
  process.exit(1);
}

console.log('Geo authority validation passed for ' + geo.hubs.length + ' curated hubs. rendered=' + rendered);
