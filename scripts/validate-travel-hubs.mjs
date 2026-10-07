import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateTravelAuthority } from '../lib/travel-authority-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteConfigPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: site } = await import(pathToFileURL(siteConfigPath).href);
const travelConfigPath = path.resolve(root, site.travelAuthority?.module || 'seo/travel-authority.config.mjs');
const module = await import(pathToFileURL(travelConfigPath).href);
const authority = module.TRAVEL_AUTHORITY;
const getEvidence = module.travelEvidenceFor;
const rendered = process.env.TRAVEL_VALIDATE_RENDERED === 'true';

const validation = validateTravelAuthority(authority, getEvidence);
const errors = [...validation.errors];
for (const warning of validation.warnings) console.warn('Travel authority warning: ' + warning);

if (rendered) {
  for (const market of authority.markets) {
    const file = path.join(root, 'travel', market.slug + '.html');
    let html = '';
    try {
      html = await fs.readFile(file, 'utf8');
    } catch {
      errors.push('Missing generated travel page: ' + path.relative(root, file));
      continue;
    }
    if (!html.includes('<link rel="canonical"')) errors.push(market.id + ': missing canonical.');
    if (!html.includes('BreadcrumbList')) errors.push(market.id + ': missing BreadcrumbList schema.');
    if (!html.includes('class="travel-authority-status"')) errors.push(market.id + ': missing status block.');
    if (!html.includes('class="travel-rate-panel"')) errors.push(market.id + ': missing durable rate block.');
    if (!html.includes('href="/travel"')) errors.push(market.id + ': missing link back to travel root.');
    if (/\/travel\/[^"' ]*(?:19|20)\d{2}/i.test(html)) errors.push(market.id + ': contains dated travel URL.');
  }

  const rootTravel = await fs.readFile(path.join(root, 'travel.html'), 'utf8');
  for (const market of authority.markets) {
    const href = authority.rootPath + '/' + market.slug;
    if (!rootTravel.includes('href="' + href + '"')) {
      errors.push('Main travel page does not link to persistent hub ' + href);
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error('Travel authority validation failed: ' + error);
  process.exit(1);
}

console.log('Travel authority validation passed for ' + authority.markets.length + ' persistent hubs. rendered=' + rendered);
