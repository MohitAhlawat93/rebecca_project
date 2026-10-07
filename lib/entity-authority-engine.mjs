import { absoluteUrl } from './seo-engine.mjs';

export function validateEntityAuthority(authority) {
  const errors = [];
  const warnings = [];

  if (authority?.schemaVersion !== 1) errors.push('Unsupported entity authority schemaVersion.');
  if (authority?.entity?.type !== 'Person') errors.push('SEARCH-05 currently expects a Person entity.');
  if (!authority?.entity?.name) errors.push('Entity name is required.');
  if (!authority?.entity?.profilePath) errors.push('Entity profilePath is required.');

  const verified = authority?.identity?.verifiedSameAs || [];
  const related = authority?.identity?.relatedProfiles || [];
  const seenIdentityUrls = new Set();

  for (const item of [...verified, ...related]) {
    if (!item?.url || !/^https:\/\//i.test(item.url)) {
      errors.push('Verified/related identity entries require HTTPS URLs.');
      continue;
    }
    if (seenIdentityUrls.has(item.url)) errors.push('Duplicate identity URL: ' + item.url);
    seenIdentityUrls.add(item.url);
  }

  for (const item of verified) {
    if (item.relationship !== 'same-entity' || item.verified !== true) {
      errors.push('sameAs entries must be explicitly verified same-entity references.');
    }
  }

  for (const item of authority?.evidence?.press || []) {
    if (!item.url || !/^https:\/\//i.test(item.url)) {
      errors.push('Press evidence requires an HTTPS source URL: ' + (item.title || '(untitled)'));
    }
    if (!item.outlet || !item.title) errors.push('Press evidence requires outlet and title.');
  }

  for (const item of authority?.evidence?.authoredWorks || []) {
    if (!item.url || !/^https:\/\//i.test(item.url)) {
      errors.push('Authored work requires an HTTPS source URL: ' + (item.title || '(untitled)'));
    }
    if (item.author !== authority.entity.name) {
      errors.push('Authored work is not attributed to the canonical entity: ' + item.title);
    }
  }

  if (authority?.reviewPolicy?.emitAggregateRating !== false) {
    errors.push('AggregateRating must remain disabled for this third-party review archive.');
  }
  if (authority?.reviewPolicy?.emitReviewSchema !== false) {
    errors.push('Review schema must remain disabled unless exact eligible source evidence is available.');
  }

  const reviews = authority?.evidence?.reviews || [];
  for (const review of reviews) {
    if (!review.source || !review.date || !review.excerpt) {
      errors.push('Every reputation entry needs source, date and excerpt/summary.');
    }
    if (review.sourceUrl && !/^https:\/\//i.test(review.sourceUrl)) {
      errors.push('Review sourceUrl must be HTTPS when present.');
    }
  }

  if (!verified.length) warnings.push('No verified sameAs identity URLs are configured.');

  return { errors, warnings };
}

export function entityGraphForRoute(site, authority, route) {
  const origin = site.deployment.origin;
  const home = absoluteUrl(origin, '/');
  const pageUrl = absoluteUrl(origin, route.path);
  const websiteId = home + '#website';
  const personId = home + authority.entity.idSuffix;
  const pageId = pageUrl + '#webpage';

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: authority.entity.name,
    alternateName: authority.entity.alternateName,
    url: home,
    image: site.seo.defaultOgImage,
    description: authority.entity.description,
    homeLocation: { '@type': 'Place', name: authority.entity.homeLocation },
    knowsLanguage: authority.entity.languages,
    sameAs: (authority.identity.verifiedSameAs || []).map((item) => item.url),
    subjectOf: (authority.evidence.press || []).map((item) => externalWork(item, personId))
  };

  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: home,
    name: site.seo.siteName
  };

  const kind = authority.pageMap[route.page.id];
  const graph = [website, person];

  if (kind === 'home') {
    graph.push({
      '@type': 'WebPage',
      '@id': pageId,
      url: pageUrl,
      name: site.seo.siteName,
      isPartOf: { '@id': websiteId },
      about: { '@id': personId },
      inLanguage: route.language.htmlLang
    });
  }

  if (kind === 'profile') {
    graph.push({
      '@type': 'ProfilePage',
      '@id': pageId,
      url: pageUrl,
      name: route.page.title || ('About ' + authority.entity.name),
      isPartOf: { '@id': websiteId },
      mainEntity: { '@id': personId },
      inLanguage: route.language.htmlLang
    });
  }

  if (kind === 'press') {
    graph.push({
      '@type': 'CollectionPage',
      '@id': pageId,
      url: pageUrl,
      name: 'Press & appearances — ' + authority.entity.name,
      isPartOf: { '@id': websiteId },
      about: { '@id': personId },
      inLanguage: route.language.htmlLang,
      citation: (authority.evidence.press || []).map((item) => item.url),
      hasPart: (authority.evidence.press || []).map((item) => externalWork(item, personId))
    });
  }

  if (kind === 'authored') {
    graph.push({
      '@type': 'CollectionPage',
      '@id': pageId,
      url: pageUrl,
      name: 'Writing by ' + authority.entity.name,
      isPartOf: { '@id': websiteId },
      about: { '@id': personId },
      inLanguage: route.language.htmlLang,
      citation: (authority.evidence.authoredWorks || []).map((item) => item.url),
      hasPart: (authority.evidence.authoredWorks || []).map((item) =>
        authoredWork(item, personId)
      )
    });
  }

  if (kind === 'reputation') {
    graph.push({
      '@type': 'CollectionPage',
      '@id': pageId,
      url: pageUrl,
      name: 'Public review history — ' + authority.entity.name,
      isPartOf: { '@id': websiteId },
      about: { '@id': personId },
      inLanguage: route.language.htmlLang,
      description:
        'A source-named public reputation archive. No self-computed aggregate rating is asserted in structured data.'
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export function injectEntityAuthorityGraph(html, graph) {
  let next = removeEntityAuthorityScripts(html);
  next = removeLegacyRebeccaEntityGraph(next);
  const tag =
    '<script type="application/ld+json" data-entity-authority>' +
    JSON.stringify(graph) +
    '</script>';
  return next.replace(/<\/head>/i, tag + '</head>');
}

export function removeEntityAuthorityScripts(html) {
  return String(html).replace(
    /<script\s+type=["']application\/ld\+json["'][^>]*data-entity-authority[^>]*>[\s\S]*?<\/script>\s*/gi,
    ''
  );
}

function removeLegacyRebeccaEntityGraph(html) {
  return String(html).replace(
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>\s*/gi,
    (full, body) => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return full;
      }
      const nodes = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed];
      const isLegacy = nodes.some((node) =>
        node?.['@type'] === 'ProfilePage' ||
        (typeof node?.['@id'] === 'string' && /#rebecca$/.test(node['@id']))
      );
      return isLegacy ? '' : full;
    }
  );
}

function externalWork(item, personId) {
  const work = {
    '@type': item.relationship === 'profile' ? 'Article' : 'Article',
    url: item.url,
    headline: item.title,
    datePublished: item.datePublished || String(item.year),
    publisher: {
      '@type': 'Organization',
      name: item.outlet,
      url: publisherHomepage(item.url)
    }
  };
  if (item.relationship === 'authored') work.author = { '@id': personId };
  else work.about = { '@id': personId };
  if (item.byline && item.relationship !== 'authored') {
    work.author = { '@type': 'Person', name: item.byline };
  }
  return work;
}

function authoredWork(item, personId) {
  return {
    '@type': 'Article',
    url: item.url,
    headline: item.title,
    datePublished: item.datePublished || String(item.year),
    author: { '@id': personId },
    publisher: {
      '@type': 'Organization',
      name: item.outlet,
      url: publisherHomepage(item.url)
    }
  };
}

function publisherHomepage(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin + '/';
  } catch {
    return undefined;
  }
}

export function collectSchemaTypes(value, bucket = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaTypes(item, bucket);
    return bucket;
  }
  if (!value || typeof value !== 'object') return bucket;
  const type = value['@type'];
  if (typeof type === 'string') bucket.push(type);
  if (Array.isArray(type)) bucket.push(...type);
  for (const child of Object.values(value)) collectSchemaTypes(child, bucket);
  return bucket;
}
