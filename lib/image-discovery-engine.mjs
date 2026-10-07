import { absoluteUrl } from './seo-engine.mjs';

export function validateImageDiscovery(config, imageConfig) {
  const errors = [];
  const warnings = [];
  if (imageConfig?.schemaVersion !== 1) errors.push('Unsupported image discovery schemaVersion.');
  if (!imageConfig?.sitemapPath) errors.push('image sitemap path is required.');

  const pageIds = new Set((config.pages || []).map((page) => page.id));
  for (const [pageId, spec] of Object.entries(imageConfig.pages || {})) {
    if (!pageIds.has(pageId)) {
      warnings.push('Image config references unknown page id: ' + pageId);
      continue;
    }
    if (!spec.primary && imageConfig.rules?.requirePageSpecificPrimaryImage) {
      errors.push(pageId + ': primary image is required.');
    }
    if (spec.primary && !isHttpsImage(spec.primary)) {
      errors.push(pageId + ': primary image must be an HTTPS image URL.');
    }
    for (const url of spec.images || []) {
      if (!isHttpsImage(url)) errors.push(pageId + ': invalid image URL ' + url);
    }
    if ((spec.images || []).length > (imageConfig.rules?.maxImagesPerLandingPage || 1000)) {
      errors.push(pageId + ': image count exceeds sitemap limit.');
    }
    if (spec.alt && spec.alt.length > (imageConfig.rules?.maxAltLength || 160)) {
      errors.push(pageId + ': primary image alt text is too long.');
    }
  }
  return { errors, warnings };
}

export function imageSpecForRoute(imageConfig, route) {
  return imageConfig.pages?.[route.page.id] || null;
}

export function renderImageSitemap(site, imageConfig) {
  const entries = [];
  for (const page of site.pages || []) {
    const spec = imageConfig.pages?.[page.id];
    if (!spec?.images?.length) continue;
    const routePath = page.path;
    const loc = absoluteUrl(site.deployment.origin, routePath);
    entries.push({
      loc,
      images: [...new Set(spec.images.map(stripTransformQuery))]
    });
  }

  const body = entries.map((entry) =>
    '  <url>\n' +
    '    <loc>' + xml(entry.loc) + '</loc>\n' +
    entry.images.map((url) =>
      '    <image:image><image:loc>' + xml(url) + '</image:loc></image:image>'
    ).join('\n') +
    '\n  </url>'
  ).join('\n');

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    body + '\n</urlset>\n';
}

export function injectImageDiscovery(html, site, route, spec, imageConfig) {
  if (!spec) return html;
  const primary = stripTransformQuery(spec.primary);
  let next = html;

  next = upsertMeta(next, 'property', 'og:image', primary);
  next = upsertMeta(next, 'property', 'og:image:alt', spec.alt || site.client.publicName);
  next = upsertMeta(next, 'name', 'twitter:image', primary);
  next = upsertMeta(next, 'name', 'twitter:image:alt', spec.alt || site.client.publicName);

  const pageUrl = absoluteUrl(site.deployment.origin, route.path);
  const imageId = primary + '#image';
  const imageObject = {
    '@type': 'ImageObject',
    '@id': imageId,
    contentUrl: primary,
    url: primary,
    caption: spec.alt || site.client.publicName,
    copyrightNotice: imageConfig.rights?.copyrightNotice || undefined,
    representativeOfPage: true
  };
  if (imageConfig.rights?.licenseUrl) imageObject.license = imageConfig.rights.licenseUrl;
  if (imageConfig.rights?.acquireLicensePage) {
    imageObject.acquireLicensePage = imageConfig.rights.acquireLicensePage;
  }
  if (imageConfig.rights?.creditText) imageObject.creditText = imageConfig.rights.creditText;
  if (imageConfig.rights?.creator) {
    imageObject.creator = { '@type': 'Person', name: imageConfig.rights.creator };
  }

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      imageObject,
      {
        '@type': 'WebPage',
        '@id': pageUrl + '#webpage',
        url: pageUrl,
        primaryImageOfPage: { '@id': imageId }
      }
    ]
  };

  next = next.replace(
    /<script\s+type=["']application\/ld\+json["'][^>]*data-image-discovery[^>]*>[\s\S]*?<\/script>\s*/gi,
    ''
  );
  const tag =
    '<script type="application/ld+json" data-image-discovery>' +
    JSON.stringify(clean(graph)) +
    '</script>';
  return next.replace(/<\/head>/i, tag + '</head>');
}

export function improveArchiveAltText(html, prefix) {
  let index = 0;
  return String(html).replace(/<img\b([^>]*?)>/gi, (full, attrs) => {
    if (!/data-image-role=["']archive-(?:professional|candid)["']/i.test(attrs)) return full;
    index += 1;
    const alt = prefix + ' — archive image ' + index;
    if (/\balt=["'][^"']*["']/i.test(attrs)) {
      return '<img' + attrs.replace(/\balt=["'][^"']*["']/i, 'alt="' + attr(alt) + '"') + '>';
    }
    return '<img' + attrs + ' alt="' + attr(alt) + '">';
  });
}

export function preferredImageVariant(url) {
  const base = stripTransformQuery(url);
  return base.includes('images.squarespace-cdn.com') ? base + '?format=1500w' : base;
}

export function stripTransformQuery(url) {
  return String(url || '').split('?')[0];
}

function upsertMeta(html, key, name, content) {
  const regex = new RegExp(
    '<meta\\s+' + key + '=["\\\']' + escapeRegex(name) +
    '["\\\'][^>]*content=["\\\'][^"\\\']*["\\\'][^>]*>',
    'i'
  );
  const tag = '<meta ' + key + '="' + attr(name) + '" content="' + attr(content) + '">';
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace(/<\/head>/i, tag + '</head>');
}

function isHttpsImage(url) {
  return /^https:\/\//i.test(String(url || '')) &&
    /\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(String(url || ''));
}

function attr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function xml(value) {
  return attr(value).replace(/'/g, '&apos;');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^$()|[\]\\]/g, '\\$&');
}

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (child !== undefined && child !== null && child !== '') output[key] = clean(child);
  }
  return output;
}
