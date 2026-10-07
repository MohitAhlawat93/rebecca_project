import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { routeIndex } from '../lib/seo-engine.mjs';
import {
  imageSpecForRoute,
  improveArchiveAltText,
  injectImageDiscovery,
  preferredImageVariant,
  renderImageSitemap,
  validateImageDiscovery
} from '../lib/image-discovery-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteConfigPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: site } = await import(pathToFileURL(siteConfigPath).href);
const imageConfigPath = path.resolve(
  root,
  site.imageDiscovery?.module || 'seo/image-discovery.config.mjs'
);
const { IMAGE_DISCOVERY: imageConfig } = await import(pathToFileURL(imageConfigPath).href);
const write = process.argv.includes('--write');

const validation = validateImageDiscovery(site, imageConfig);
for (const warning of validation.warnings) console.warn('Image discovery warning: ' + warning);
if (validation.errors.length) {
  for (const error of validation.errors) console.error('Image discovery error: ' + error);
  process.exit(1);
}

let changed = 0;
for (const route of routeIndex(site).filter((item) => item.searchApproved)) {
  const spec = imageSpecForRoute(imageConfig, route);
  if (!spec) continue;

  const full = path.join(root, route.file);
  let html;
  try {
    html = await fs.readFile(full, 'utf8');
  } catch {
    console.error('Image discovery target missing: ' + route.file);
    process.exitCode = 1;
    continue;
  }

  let next = injectImageDiscovery(html, site, route, {
    ...spec,
    primary: preferredImageVariant(spec.primary)
  }, imageConfig);

  if (spec.archiveAltPrefix) {
    next = improveArchiveAltText(next, spec.archiveAltPrefix);
  }

  if (next !== html) {
    changed += 1;
    console.log((write ? 'WRITE ' : 'CHANGE ') + route.file);
    if (write) await fs.writeFile(full, next);
  }
}

const sitemapPath = path.join(root, imageConfig.sitemapPath.replace(/^\//, ''));
const nextSitemap = renderImageSitemap(site, imageConfig);
let currentSitemap = '';
try {
  currentSitemap = await fs.readFile(sitemapPath, 'utf8');
} catch {
  // generated file may not exist yet
}
if (currentSitemap !== nextSitemap) {
  changed += 1;
  console.log((write ? 'WRITE ' : 'CHANGE ') + path.relative(root, sitemapPath));
  if (write) await fs.writeFile(sitemapPath, nextSitemap);
}

const robotsPath = path.join(root, 'robots.txt');
let robots = await fs.readFile(robotsPath, 'utf8');
const sitemapUrl = site.deployment.origin + imageConfig.sitemapPath;
const line = 'Sitemap: ' + sitemapUrl;
robots = robots
  .split(/\r?\n/)
  .filter((item) => !/^Sitemap: .*image-sitemap\.xml\s*$/i.test(item))
  .join('\n')
  .replace(/\s*$/, '\n') + line + '\n';
const currentRobots = await fs.readFile(robotsPath, 'utf8');
if (robots !== currentRobots) {
  changed += 1;
  console.log((write ? 'WRITE ' : 'CHANGE ') + 'robots.txt');
  if (write) await fs.writeFile(robotsPath, robots);
}

if (process.exitCode) process.exit(process.exitCode);
console.log(
  'Image discovery render ' + (write ? 'completed' : 'preview') + ': ' +
  changed + ' file(s) ' + (write ? 'updated.' : 'would change.')
);
