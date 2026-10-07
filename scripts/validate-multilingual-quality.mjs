import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { hreflangEntries, routeIndex } from '../lib/seo-engine.mjs';
import {
  extractVisibleText,
  scriptRatio,
  textSimilarity
} from '../lib/multilingual-quality-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: config } = await import(pathToFileURL(configPath).href);
const rendered = process.env.MULTILINGUAL_VALIDATE_RENDERED === 'true';
const quality = config.multilingualQuality;
const rules = quality.rules || {};
const failures = [];
const notices = [];
const routes = routeIndex(config);
const primaryLanguage = config.languages[0];

for (const page of config.pages.filter((item) => item.localized)) {
  const sourceRoute = routes.find(
    (route) => route.page.id === page.id && route.language.id === primaryLanguage.id
  );

  if (!sourceRoute) {
    failures.push(page.id + ': primary-language route is missing.');
    continue;
  }

  const sourceHtml = await read(sourceRoute.file);
  if (!sourceHtml) {
    failures.push(page.id + ': primary-language file is missing: ' + sourceRoute.file);
    continue;
  }

  const sourceTitle = match(sourceHtml, /<title>([\s\S]*?)<\/title>/i);
  const sourceDescription = metaContent(sourceHtml, 'description');
  const sourceText = extractVisibleText(sourceHtml);

  for (const route of routes.filter((item) => item.page.id === page.id)) {
    const html = await read(route.file);
    if (!html) {
      failures.push(route.file + ': localized route file is missing.');
      continue;
    }

    const status = route.languageSearchStatus;
    const lang = match(html, /<html\s+[^>]*lang=["']([^"']+)["']/i);
    const title = match(html, /<title>([\s\S]*?)<\/title>/i);
    const description = metaContent(html, 'description');
    const text = extractVisibleText(html);
    const similarity =
      route.language.id === primaryLanguage.id ? 0 : textSimilarity(sourceText, text);
    const targetScriptMinimum = rules.targetScriptMinimum?.[route.language.htmlLang];
    const ratio =
      targetScriptMinimum == null ? null : scriptRatio(text, route.language.htmlLang);

    if (lang !== route.language.htmlLang) {
      failures.push(
        route.file + ': html lang is ' + (lang || '(missing)') +
        ', expected ' + route.language.htmlLang + '.'
      );
    }

    if (route.searchApproved && route.language.id !== primaryLanguage.id) {
      if (rules.requireTranslatedTitle && normalize(title) === normalize(sourceTitle)) {
        failures.push(route.file + ': SEO-approved locale still uses the source-language title.');
      }
      if (
        rules.requireTranslatedDescription &&
        normalize(description) === normalize(sourceDescription)
      ) {
        failures.push(
          route.file + ': SEO-approved locale still uses the source-language description.'
        );
      }
      if (similarity > (rules.maxSourceSimilarityForApprovedLocale ?? 0.72)) {
        failures.push(
          route.file + ': source-language similarity ' + similarity.toFixed(2) +
          ' is too high for an SEO-approved localized page.'
        );
      }
      if (ratio != null && ratio < targetScriptMinimum) {
        failures.push(
          route.file + ': target-script ratio ' + ratio.toFixed(2) +
          ' is below required ' + targetScriptMinimum + '.'
        );
      }

      const localeConfig = quality.locales?.[route.language.id];
      if (rules.requireNativeReviewForIndexing && localeConfig?.nativeReviewRequired) {
        const evidence = localeConfig.approvalEvidence?.[page.id];
        if (!evidence?.reviewer || !evidence?.reviewedAt) {
          failures.push(
            route.file + ': SEO-approved locale is missing native-review evidence.'
          );
        }
      }
    }

    if (route.language.id !== primaryLanguage.id) {
      notices.push(
        route.file + ': status=' + status +
        '; similarity=' + similarity.toFixed(2) +
        (ratio == null ? '' : '; target-script-ratio=' + ratio.toFixed(2))
      );
    }
  }
}

if (rendered) {
  const sitemap = await read('sitemap.xml');
  if (!sitemap) failures.push('Rendered sitemap.xml is missing.');

  for (const page of config.pages.filter((item) => item.localized)) {
    const pageRoutes = routes.filter((route) => route.page.id === page.id);
    const expected = hreflangEntries(config, page);

    for (const route of pageRoutes) {
      const html = await read(route.file);
      if (!html) continue;

      const links = [...html.matchAll(
        /<link\s+rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi
      )].map((match) => ({ hreflang: match[1], href: match[2] }));

      if (route.searchApproved) {
        for (const item of expected) {
          if (
            !links.some(
              (link) => link.hreflang === item.hreflang && link.href === item.href
            )
          ) {
            failures.push(
              route.file + ': missing reciprocal hreflang ' +
              item.hreflang + ' → ' + item.href + '.'
            );
          }
        }
      } else if (links.length) {
        failures.push(
          route.file + ': non-approved locale should not emit hreflang annotations.'
        );
      }

      const inSitemap = sitemap?.includes('<loc>' + route.canonical + '</loc>');
      if (
        route.searchApproved &&
        route.language.includeInSitemap !== false &&
        !inSitemap
      ) {
        failures.push(
          route.file + ': SEO-approved localized URL is missing from sitemap.'
        );
      }
      if (!route.searchApproved && inSitemap) {
        failures.push(
          route.file + ': non-approved localized URL leaked into sitemap.'
        );
      }
    }
  }
}

for (const notice of notices) console.warn('Multilingual audit: ' + notice);

if (failures.length) {
  for (const failure of failures) {
    console.error('Multilingual validation failed: ' + failure);
  }
  process.exit(1);
}

const approvedNonPrimary = routes.filter(
  (route) =>
    route.page.localized &&
    route.language.id !== primaryLanguage.id &&
    route.searchApproved
).length;

console.log(
  'Multilingual quality validation passed. approved non-primary localized pages=' +
  approvedNonPrimary + '; rendered=' + rendered
);

async function read(relativePath) {
  try {
    return await fs.readFile(path.join(root, relativePath), 'utf8');
  } catch {
    return '';
  }
}

function match(text, regex) {
  return text.match(regex)?.[1]?.trim() || '';
}

function metaContent(html, name) {
  const escaped = String(name).replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  return match(
    html,
    new RegExp(
      '<meta\\s+name=["\\']' + escaped +
      '["\\'][^>]*content=["\\']([^"\\']+)["\\'][^>]*>',
      'i'
    )
  );
}

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}
