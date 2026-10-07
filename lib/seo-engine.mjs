import { localeApproved, localeStatus, validateLocaleQualityConfig } from './multilingual-quality-engine.mjs';
import path from 'node:path';

export function normalizeOrigin(value) {
  const origin = String(value || '').trim().replace(/\/+$/, '');
  if (!/^https:\/\//i.test(origin)) {
    throw new Error(`SEO origin must use HTTPS: ${origin || '(empty)'}`);
  }
  return origin;
}

export function normalizePath(value) {
  if (!value || value === '/') return '/';
  const clean = `/${String(value).replace(/^\/+|\/+$/g, '')}`;
  return clean || '/';
}

export function absoluteUrl(origin, pathname = '/') {
  const base = normalizeOrigin(origin);
  const cleanPath = normalizePath(pathname);
  return cleanPath === '/' ? `${base}/` : `${base}${cleanPath}`;
}

export function languageFor(config, languageId) {
  const language = config.languages.find((item) => item.id === languageId);
  if (!language) throw new Error(`Unknown SEO language: ${languageId}`);
  return language;
}

export function pagePath(page, language) {
  const basePath = normalizePath(page.path);
  if (!page.localized || !language.prefix) return basePath;
  const prefix = normalizePath(language.prefix);
  if (basePath === '/') return `${prefix}/`;
  return `${prefix}${basePath}`;
}

export function pageFile(page, language) {
  if (!page.localized || !language.prefix) return page.file;
  const folder = language.prefix.replace(/^\/+|\/+$/g, '');
  const fileName = page.file === 'index.html' ? 'index.html' : path.basename(page.file);
  return path.posix.join(folder, fileName);
}

export function routeIndex(config) {
  const routes = [];
  const primaryLanguage = config.languages[0];
  for (const page of config.pages) {
    const languages = page.localized ? config.languages : [primaryLanguage];
    for (const language of languages) {
      routes.push({
        page,
        language,
        path: pagePath(page, language),
        file: pageFile(page, language),
        canonical: absoluteUrl(config.deployment.origin, pagePath(page, language)),
        languageSearchStatus: localeStatus(config, language, page),
        searchApproved: localeApproved(config, language, page) && page.indexable !== false,
        indexable:
          Boolean(config.deployment.indexingEnabled) &&
          localeApproved(config, language, page) &&
          page.indexable !== false
      });
    }
  }
  return routes;
}

export function hreflangEntries(config, page) {
  if (!page.localized) return [];
  const approved = config.languages.filter(
    (language) => language.includeInHreflang && localeApproved(config, language, page)
  );
  const entries = approved.map((language) => ({
    hreflang: language.hreflang,
    href: absoluteUrl(config.deployment.origin, pagePath(page, language))
  }));
  const primary = approved[0];
  if (primary) {
    entries.push({
      hreflang: 'x-default',
      href: absoluteUrl(config.deployment.origin, pagePath(page, primary))
    });
  }
  return entries;
}

export function robotsContent(config) {
  if (!config.deployment.indexingEnabled) {
    return ['User-agent: *', 'Disallow: /', ''].join('\n');
  }

  const lines = ['User-agent: *', 'Allow: /'];
  for (const prefix of config.seo.excludedPrefixes || []) {
    lines.push(`Disallow: ${prefix}`);
  }
  lines.push(`Sitemap: ${absoluteUrl(config.deployment.origin, '/sitemap.xml')}`, '');
  return lines.join('\n');
}

export function sitemapContent(config, lastmod = new Date().toISOString().slice(0, 10)) {
  const urls = routeIndex(config).filter(
    (route) =>
      route.searchApproved &&
      (route.page.localized ? route.language.includeInSitemap !== false : true)
  );

  const body = urls
    .map((route) => {
      const priority = Number(route.page.priority ?? 0.5).toFixed(1);
      return `  <url><loc>${escapeXml(route.canonical)}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function validateSiteConfig(config) {
  const errors = [];
  const warnings = [];
  const multilingualValidation = validateLocaleQualityConfig(config);
  errors.push(...multilingualValidation.errors);
  warnings.push(...multilingualValidation.warnings);

  if (config.schemaVersion !== 1) errors.push('Unsupported SEO config schemaVersion.');
  if (!config.client?.id) errors.push('client.id is required.');
  if (!config.client?.brandName) errors.push('client.brandName is required.');
  if (!config.market?.primaryCountry) errors.push('market.primaryCountry is required.');
  if (!config.market?.primaryLocale) errors.push('market.primaryLocale is required.');

  try {
    normalizeOrigin(config.deployment?.origin);
    normalizeOrigin(config.deployment?.productionOrigin);
  } catch (error) {
    errors.push(error.message);
  }

  const languageIds = new Set();
  const hreflangs = new Set();
  for (const language of config.languages || []) {
    if (languageIds.has(language.id)) errors.push(`Duplicate language id: ${language.id}`);
    if (hreflangs.has(language.hreflang)) errors.push(`Duplicate hreflang: ${language.hreflang}`);
    languageIds.add(language.id);
    hreflangs.add(language.hreflang);
    const hasApprovedPage = (config.pages || []).some(
      (page) => page.localized && localeApproved(config, language, page)
    );
    if ((language.includeInSitemap || language.includeInHreflang) && !hasApprovedPage && language.id !== config.languages?.[0]?.id) {
      warnings.push(`${language.id} has no SEO-approved localized pages yet; it will stay out of sitemap/hreflang output.`);
    }
  }

  const pageIds = new Set();
  const paths = new Set();
  const files = new Set();
  for (const page of config.pages || []) {
    if (pageIds.has(page.id)) errors.push(`Duplicate page id: ${page.id}`);
    if (paths.has(normalizePath(page.path))) errors.push(`Duplicate page path: ${page.path}`);
    if (files.has(page.file)) errors.push(`Duplicate page file: ${page.file}`);
    pageIds.add(page.id);
    paths.add(normalizePath(page.path));
    files.add(page.file);
  }

  if (config.deployment?.mode === 'production' && !config.deployment?.indexingEnabled) {
    warnings.push('SEO mode is production while indexingEnabled is false.');
  }

  return { errors, warnings };
}

export function replaceOrInsertCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtmlAttribute(href)}">`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, tag);
  }
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

export function replaceOrInsertOgUrl(html, href) {
  const tag = `<meta property="og:url" content="${escapeHtmlAttribute(href)}">`;
  if (/<meta\s+property=["']og:url["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\s+property=["']og:url["'][^>]*>/i, tag);
  }
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

export function replaceOrInsertRobots(html, indexable, maxImagePreview = 'large') {
  const content = indexable
    ? `index,follow,max-image-preview:${maxImagePreview}`
    : 'noindex,nofollow,noarchive';
  const tag = `<meta name="robots" content="${content}">`;
  if (/<meta\s+name=["']robots["'][^>]*>/i.test(html)) {
    return html.replace(/<meta\s+name=["']robots["'][^>]*>/i, tag);
  }
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

export function replaceHtmlLang(html, htmlLang) {
  if (/<html\s+[^>]*lang=["'][^"']*["'][^>]*>/i.test(html)) {
    return html.replace(/(<html\s+[^>]*lang=)["'][^"']*["']/i, `$1"${htmlLang}"`);
  }
  return html.replace(/<html(\s|>)/i, `<html lang="${htmlLang}"$1`);
}

export function replaceHreflangCluster(html, entries) {
  const cleaned = html.replace(
    /<link\s+rel=["']alternate["'][^>]*(?:data-(?:rr|seo)-hreflang|hreflang=)[^>]*>\s*/gi,
    ''
  );
  if (!entries.length) return cleaned;
  const tags = entries
    .map(
      ({ hreflang, href }) =>
        `<link rel="alternate" data-seo-hreflang hreflang="${escapeHtmlAttribute(hreflang)}" href="${escapeHtmlAttribute(href)}">`
    )
    .join('');
  return cleaned.replace(/<\/head>/i, `${tags}</head>`);
}

export function rewriteStructuredDataOrigins(html, config) {
  const legacyOrigins = new Set(
    (config.seo.legacyCanonicalOrigins || []).map((value) => normalizeOrigin(value))
  );
  const newOrigin = normalizeOrigin(config.deployment.origin);

  return html.replace(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    (full, jsonText) => {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        return full;
      }
      rewriteJsonLdNode(parsed, null, legacyOrigins, newOrigin);
      return full.replace(jsonText, JSON.stringify(parsed));
    }
  );
}

function rewriteJsonLdNode(value, parentKey, legacyOrigins, newOrigin) {
  if (Array.isArray(value)) {
    for (const item of value) rewriteJsonLdNode(item, parentKey, legacyOrigins, newOrigin);
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if ((key === '@id' || key === 'url') && typeof child === 'string') {
      value[key] = replaceOrigin(child, legacyOrigins, newOrigin);
      continue;
    }
    if (key === 'sameAs') continue;
    rewriteJsonLdNode(child, key, legacyOrigins, newOrigin);
  }
}

function replaceOrigin(value, legacyOrigins, newOrigin) {
  for (const oldOrigin of legacyOrigins) {
    if (value === oldOrigin) return newOrigin;
    if (value.startsWith(`${oldOrigin}/`) || value.startsWith(`${oldOrigin}#`)) {
      return `${newOrigin}${value.slice(oldOrigin.length)}`;
    }
  }
  return value;
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
