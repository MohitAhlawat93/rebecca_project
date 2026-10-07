import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { routeIndex } from '../lib/seo-engine.mjs';
import {
  imageSpecForRoute,
  stripTransformQuery,
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
const rendered = process.env.IMAGE_VALIDATE_RENDERED === 'true';

const validation = validateImageDiscovery(site, imageConfig);
const errors = [...validation.errors];
for (const warning of validation.warnings) console.warn('Image discovery warning: ' + warning);

if (rendered) {
  const sitemapFile = imageConfig.sitemapPath.replace(/^\//, '');
  let imageSitemap = '';
  try {
    imageSitemap = await fs.readFile(path.join(root, sitemapFile), 'utf8');
  } catch {
    errors.push('Missing image sitemap: ' + sitemapFile);
  }

  if (imageSitemap && !imageSitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
    errors.push('Image sitemap is missing Google image namespace.');
  }

  for (const route of routeIndex(site).filter((item) => item.searchApproved)) {
    const spec = imageSpecForRoute(imageConfig, route);
    if (!spec) continue;

    let html = '';
    try {
      html = await fs.readFile(path.join(root, route.file), 'utf8');
    } catch {
      errors.push(route.file + ': image discovery target is missing.');
      continue;
    }

    const scripts = [...html.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*data-image-discovery[^>]*>([\s\S]*?)<\/script>/gi
    )];
    if (scripts.length !== 1) {
      errors.push(route.file + ': expected exactly one image discovery graph.');
    } else {
      let graph;
      try {
        graph = JSON.parse(scripts[0][1]);
      } catch {
        errors.push(route.file + ': image discovery JSON-LD is invalid.');
      }
      if (graph) {
        const nodes = Array.isArray(graph['@graph']) ? graph['@graph'] : [];
        const image = nodes.find((node) => node?.['@type'] === 'ImageObject');
        const page = nodes.find((node) => node?.['@type'] === 'WebPage');
        if (!image?.contentUrl) errors.push(route.file + ': ImageObject contentUrl missing.');
        if (!page?.primaryImageOfPage?.['@id']) {
          errors.push(route.file + ': primaryImageOfPage relation missing.');
        }
      }
    }

    const og = match(
      html,
      /<meta\s+property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    const ogAlt = match(
      html,
      /<meta\s+property=["']og:image:alt["'][^>]*content=["']([^"']+)["'][^>]*>/i
    );
    if (!og) errors.push(route.file + ': page-specific og:image missing.');
    if (!ogAlt) errors.push(route.file + ': og:image:alt missing.');

    if (imageSitemap) {
      const pageUrl = site.deployment.origin + (route.path === '/' ? '/' : route.path);
      if (!imageSitemap.includes('<loc>' + xml(pageUrl) + '</loc>')) {
        errors.push(route.file + ': landing page missing from image sitemap.');
      }
      for (const url of spec.images || []) {
        const clean = stripTransformQuery(url);
        if (!imageSitemap.includes('<image:loc>' + xml(clean) + '</image:loc>')) {
          errors.push(route.file + ': image sitemap missing ' + clean);
        }
      }
    }

    if (spec.archiveAltPrefix) {
      const archiveImages = [...html.matchAll(
        /<img\b[^>]*data-image-role=["']archive-(?:professional|candid)["'][^>]*>/gi
      )];
      for (const matchImage of archiveImages) {
        const alt = match(matchImage[0], /\balt=["']([^"']*)["']/i);
        if (!alt || !alt.startsWith(spec.archiveAltPrefix)) {
          errors.push(route.file + ': archive image has weak or missing contextual alt text.');
          break;
        }
      }
    }
  }

  const robots = await fs.readFile(path.join(root, 'robots.txt'), 'utf8');
  const expected = 'Sitemap: ' + site.deployment.origin + imageConfig.sitemapPath;
  if (!robots.includes(expected)) errors.push('robots.txt is missing image sitemap reference.');
}

if (imageConfig.migrateToOwnedHostLater) {
  console.warn(
    'Image discovery notice: image URLs still use ' + imageConfig.sourceHost +
    '; migrate to an owned/custom image hostname before final production if practical.'
  );
}

if (errors.length) {
  for (const error of errors) console.error('Image discovery validation failed: ' + error);
  process.exit(1);
}

console.log(
  'Image discovery validation passed. configured pages=' +
  Object.keys(imageConfig.pages || {}).length + '; rendered=' + rendered
);

function match(text, regex) {
  return text.match(regex)?.[1]?.trim() || '';
}

function xml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
