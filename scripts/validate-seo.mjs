import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { routeIndex, validateSiteConfig } from '../lib/seo-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: config } = await import(pathToFileURL(configPath).href);
const strictRendered = process.env.SEO_VALIDATE_RENDERED === 'true';

const { errors, warnings } = validateSiteConfig(config);
const failures = [...errors];
const notices = [...warnings];
const canonicalMap = new Map();

for (const route of routeIndex(config)) {
  const fullPath = path.join(root, route.file);
  let html;
  try {
    html = await fs.readFile(fullPath, 'utf8');
  } catch {
    if (route.page.generated && !strictRendered) {
      notices.push(`Generated SEO page will be created at build time: ${route.file}`);
      continue;
    }
    failures.push(`Configured SEO page is missing: ${route.file}`);
    continue;
  }

  const title = match(html, /<title>([\s\S]*?)<\/title>/i);
  const description = match(
    html,
    /<meta\s+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i
  );
  const canonical = match(
    html,
    /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i
  );

  if (!title) failures.push(`${route.file}: missing <title>.`);
  if (!description) failures.push(`${route.file}: missing meta description.`);
  if (!canonical) failures.push(`${route.file}: missing canonical.`);

  if (canonical) {
    if (canonicalMap.has(canonical)) {
      failures.push(`${route.file}: duplicate canonical also used by ${canonicalMap.get(canonical)}.`);
    } else {
      canonicalMap.set(canonical, route.file);
    }
    if (strictRendered && canonical !== route.canonical) {
      failures.push(
        `${route.file}: canonical ${canonical} does not match configured ${route.canonical}.`
      );
    }
  }

  if (strictRendered) {
    const robots = match(
      html,
      /<meta\s+name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    const shouldIndex = route.indexable;
    if (shouldIndex && robots && /noindex/i.test(robots)) {
      failures.push(`${route.file}: configured indexable but robots contains noindex.`);
    }
    if (!shouldIndex && (!robots || !/noindex/i.test(robots))) {
      failures.push(`${route.file}: configured non-indexable but robots noindex is missing.`);
    }
  }
}

const sourceText = await collectTextFiles(root, ['.html', '.xml', '.txt', '.js', '.mjs', '.md']);
const canonicalOrigins = new Set();
for (const candidate of sourceText.matchAll(
  /https:\/\/[a-z0-9.-]+(?:\.vercel\.app|risquerebecca\.com)/gi
)) {
  canonicalOrigins.add(candidate[0].replace(/\/+$/, ''));
}
if (canonicalOrigins.size > 2) {
  notices.push(`Multiple public origins detected in source: ${[...canonicalOrigins].join(', ')}`);
}

for (const notice of notices) console.warn(`SEO notice: ${notice}`);
if (failures.length) {
  for (const failure of failures) console.error(`SEO validation failed: ${failure}`);
  process.exit(1);
}

console.log(
  `SEO validation passed for ${routeIndex(config).length} configured route variants. strictRendered=${strictRendered}`
);

function match(text, regex) {
  return text.match(regex)?.[1]?.trim() || '';
}

async function collectTextFiles(directory, extensions) {
  const chunks = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      chunks.push(await collectTextFiles(full, extensions));
    } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
      try {
        chunks.push(await fs.readFile(full, 'utf8'));
      } catch {
        // Ignore non-text/unreadable files.
      }
    }
  }
  return chunks.join('\n');
}
