import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  hreflangEntries,
  replaceHreflangCluster,
  replaceHtmlLang,
  replaceOrInsertCanonical,
  replaceOrInsertOgUrl,
  replaceOrInsertRobots,
  rewriteStructuredDataOrigins,
  robotsContent,
  routeIndex,
  sitemapContent,
  validateSiteConfig
} from '../lib/seo-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: config } = await import(pathToFileURL(configPath).href);
const write = process.argv.includes('--write');
const check = process.argv.includes('--check');

const validation = validateSiteConfig(config);
for (const warning of validation.warnings) console.warn(`SEO config warning: ${warning}`);
if (validation.errors.length) {
  for (const error of validation.errors) console.error(`SEO config error: ${error}`);
  process.exit(1);
}

let changed = 0;
const missing = [];

for (const route of routeIndex(config)) {
  const fullPath = path.join(root, route.file);
  let html;
  try {
    html = await fs.readFile(fullPath, 'utf8');
  } catch {
    missing.push(route.file);
    continue;
  }

  const alternateEntries = route.page.localized ? hreflangEntries(config, route.page) : [];
  let next = html;
  next = replaceHtmlLang(next, route.language.htmlLang);
  next = replaceOrInsertCanonical(next, route.canonical);
  next = replaceOrInsertOgUrl(next, route.canonical);
  next = replaceOrInsertRobots(next, route.indexable, config.seo.maxImagePreview);
  next = replaceHreflangCluster(next, alternateEntries);
  next = rewriteStructuredDataOrigins(next, config);

  if (next !== html) {
    changed += 1;
    console.log(`${write ? 'WRITE' : 'CHANGE'} ${route.file}`);
    if (write) await fs.writeFile(fullPath, next);
  }
}

const robotsPath = path.join(root, 'robots.txt');
const sitemapPath = path.join(root, 'sitemap.xml');
const nextRobots = robotsContent(config);
const nextSitemap = sitemapContent(
  config,
  process.env.SEO_LASTMOD || new Date().toISOString().slice(0, 10)
);

changed += await updateGeneratedFile(robotsPath, nextRobots, 'robots.txt');
changed += await updateGeneratedFile(sitemapPath, nextSitemap, 'sitemap.xml');

if (missing.length) {
  console.error(`Missing configured SEO files: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(
  `SEO render ${write ? 'completed' : 'preview'}: ${changed} file(s) ${write ? 'updated' : 'would change'}; mode=${config.deployment.mode}; origin=${config.deployment.origin}; indexing=${config.deployment.indexingEnabled}`
);

if (check && changed) process.exit(2);

async function updateGeneratedFile(fullPath, content, label) {
  let current = '';
  try {
    current = await fs.readFile(fullPath, 'utf8');
  } catch {
    // A missing generated file is treated as a change.
  }
  if (current === content) return 0;
  console.log(`${write ? 'WRITE' : 'CHANGE'} ${label}`);
  if (write) await fs.writeFile(fullPath, content);
  return 1;
}
