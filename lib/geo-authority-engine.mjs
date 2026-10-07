import { absoluteUrl } from './seo-engine.mjs';

export function validateGeoAuthority(config) {
  const errors = [];
  const warnings = [];
  const hubs = config?.hubs || [];

  if (config?.schemaVersion !== 1) errors.push('Unsupported geo authority schemaVersion.');
  if (!config?.country?.name || !config?.country?.path) errors.push('Geo country hub requires name and path.');
  if (!hubs.length) errors.push('At least one curated geo hub is required.');
  if (config?.launchLimit && hubs.length > config.launchLimit) {
    errors.push(`Geo launch has ${hubs.length} hubs, above configured launchLimit ${config.launchLimit}.`);
  }

  const ids = new Set();
  const slugs = new Set();
  const titles = new Set();

  for (const hub of hubs) {
    if (!hub.id || !hub.slug || !hub.name) errors.push('Every geo hub needs id, slug and name.');
    if (ids.has(hub.id)) errors.push(`Duplicate geo hub id: ${hub.id}`);
    if (slugs.has(hub.slug)) errors.push(`Duplicate geo hub slug: ${hub.slug}`);
    if (titles.has(hub.title)) errors.push(`Duplicate geo hub title: ${hub.title}`);
    ids.add(hub.id);
    slugs.add(hub.slug);
    titles.add(hub.title);

    const editorial = (hub.sections || []).map((section) => section.heading + ' ' + section.body).join(' ');
    if ((hub.sections || []).length < 4) errors.push(`${hub.id}: needs at least four distinct editorial sections.`);
    if (editorial.length < (config.minimumEditorialCharacters || 700)) {
      errors.push(`${hub.id}: editorial content is too thin (${editorial.length} characters).`);
    }
    if (!hub.source?.url || !/^https:\/\//.test(hub.source.url)) {
      errors.push(`${hub.id}: needs a verifiable HTTPS source.`);
    }
    if (!hub.description || hub.description.length < 80) {
      warnings.push(`${hub.id}: meta description is unusually short.`);
    }
  }

  const threshold = config.maximumPairwiseSimilarity ?? 0.6;
  for (let i = 0; i < hubs.length; i += 1) {
    for (let j = i + 1; j < hubs.length; j += 1) {
      const a = editorialText(hubs[i]);
      const b = editorialText(hubs[j]);
      const similarity = jaccardSimilarity(a, b);
      if (similarity > threshold) {
        errors.push(
          `${hubs[i].id} and ${hubs[j].id} are too similar (${similarity.toFixed(2)} > ${threshold}).`
        );
      }
    }
  }

  return { errors, warnings };
}

export function renderCountryHub(site, geo) {
  const country = geo.country;
  const canonical = absoluteUrl(site.deployment.origin, country.path);
  const cards = geo.hubs.map((hub) => `
    <a class="geo-hub-card" href="${country.path}/${hub.slug}">
      <span>${escapeHtml(hub.shortLabel)}</span>
      <h2>${escapeHtml(hub.name)}</h2>
      <p>${escapeHtml(hub.hero)}</p>
      <em>Explore ${escapeHtml(hub.name)} <b aria-hidden="true">→</b></em>
    </a>`).join('');

  const compare = geo.hubs.map((hub) => `
    <div class="geo-compare-row">
      <strong>${escapeHtml(hub.name)}</strong>
      <span>${escapeHtml(hub.goodFor.join(' · '))}</span>
    </div>`).join('');

  const body = `
    ${breadcrumbMarkup([
      { label: 'Home', href: '/' },
      { label: country.name, href: country.path }
    ])}
    <section class="geo-hero">
      <div>
        <p class="page-kicker">${escapeHtml(country.eyebrow)}</p>
        <h1>${escapeHtml(country.heading)}</h1>
      </div>
      <p class="geo-hero-copy">${escapeHtml(country.intro)}</p>
    </section>
    <section class="geo-section">
      <div class="geo-section-heading">
        <p class="page-kicker">Choose the mood</p>
        <h2>Start with the neighbourhood, not the keyword.</h2>
        <p>Each guide exists because the area creates a genuinely different kind of day. If two neighbourhoods cannot justify different advice, they should not become separate search pages.</p>
      </div>
      <div class="geo-hub-grid">${cards}</div>
    </section>
    <section class="geo-section geo-section-dark">
      <div class="geo-section-heading">
        <p class="page-kicker">Rebecca’s lens</p>
        <h2>Useful because it reflects a real person.</h2>
      </div>
      <div class="geo-prose">${country.perspective.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</div>
    </section>
    <section class="geo-section">
      <div class="geo-section-heading">
        <p class="page-kicker">At a glance</p>
        <h2>Three moods, one home base.</h2>
      </div>
      <div class="geo-compare">${compare}</div>
      <p class="geo-source-note">Area context fact-checked ${escapeHtml(country.lastFactCheck)} against <a href="${escapeAttribute(country.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(country.source.label)} ↗</a>. Venue details can change.</p>
    </section>
    ${exploreRebeccaBand()}
  `;

  return pageDocument(site, {
    title: country.title,
    description: country.description,
    canonical,
    body,
    schema: countrySchema(site, geo)
  });
}

export function renderMicroHub(site, geo, hub) {
  const path = `${geo.country.path}/${hub.slug}`;
  const canonical = absoluteUrl(site.deployment.origin, path);
  const sectionMarkup = hub.sections.map((section, index) => `
    <article class="geo-editorial-block">
      <span>0${index + 1}</span>
      <div>
        <h2>${escapeHtml(section.heading)}</h2>
        <p>${escapeHtml(section.body)}</p>
      </div>
    </article>`).join('');

  const factMarkup = hub.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join('');
  const pillMarkup = hub.goodFor.map((item) => `<span>${escapeHtml(item)}</span>`).join('');
  const related = geo.hubs
    .filter((item) => hub.related.includes(item.id))
    .map((item) => `<a href="${geo.country.path}/${item.slug}"><span>${escapeHtml(item.shortLabel)}</span><strong>${escapeHtml(item.name)}</strong><b aria-hidden="true">→</b></a>`)
    .join('');

  const body = `
    ${breadcrumbMarkup([
      { label: 'Home', href: '/' },
      { label: geo.country.name, href: geo.country.path },
      { label: hub.name, href: path }
    ])}
    <section class="geo-hero geo-hero-micro">
      <div>
        <p class="page-kicker">${escapeHtml(geo.country.name)} · ${escapeHtml(hub.shortLabel)}</p>
        <h1>${escapeHtml(hub.name)}</h1>
      </div>
      <div class="geo-hero-side">
        <p class="geo-hero-copy">${escapeHtml(hub.hero)}</p>
        <div class="geo-pill-row">${pillMarkup}</div>
      </div>
    </section>
    <section class="geo-section">
      <div class="geo-section-heading">
        <p class="page-kicker">The useful context</p>
        <h2>Why ${escapeHtml(hub.name)} is its own page.</h2>
      </div>
      <ul class="geo-facts">${factMarkup}</ul>
    </section>
    <section class="geo-editorial">${sectionMarkup}</section>
    <section class="geo-section geo-source-section">
      <div class="geo-section-heading">
        <p class="page-kicker">Accuracy before optimisation</p>
        <h2>Keep the guide current.</h2>
      </div>
      <div class="geo-prose">
        <p>This page deliberately avoids pretending every venue, opening hour or reservation policy is permanent. For current destination information, check the official source before making plans.</p>
        <p><a class="inline-link" href="${escapeAttribute(hub.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(hub.source.label)} <span aria-hidden="true">↗</span></a></p>
      </div>
    </section>
    <section class="geo-section">
      <div class="geo-section-heading">
        <p class="page-kicker">Keep exploring</p>
        <h2>Another side of Singapore.</h2>
      </div>
      <div class="geo-related-grid">${related}</div>
      <a class="inline-link" href="${geo.country.path}">Back to Rebecca’s Singapore <span aria-hidden="true">→</span></a>
    </section>
    ${exploreRebeccaBand()}
  `;

  return pageDocument(site, {
    title: hub.title,
    description: hub.description,
    canonical,
    body,
    schema: microHubSchema(site, geo, hub)
  });
}

export function jaccardSimilarity(a, b) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / union.size;
}

function pageDocument(site, { title, description, canonical, body, schema }) {
  const robots = site.deployment.indexingEnabled
    ? `index,follow,max-image-preview:${site.seo.maxImagePreview || 'large'}`
    : 'noindex,nofollow,noarchive';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5efe7"><meta name="description" content="${escapeAttribute(description)}"><meta name="robots" content="${robots}"><meta property="og:site_name" content="${escapeAttribute(site.seo.siteName)}"><meta property="og:locale" content="en_SG"><meta property="og:title" content="${escapeAttribute(title)}"><meta property="og:description" content="${escapeAttribute(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${escapeAttribute(canonical)}"><meta property="og:image" content="${escapeAttribute(site.seo.defaultOgImage)}"><meta name="twitter:card" content="summary_large_image"><title>${escapeHtml(title)}</title><link rel="canonical" href="${escapeAttribute(canonical)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/site.webmanifest"><link rel="stylesheet" href="/styles.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body><a class="skip-link" href="#main">Skip to content</a>${headerMarkup(site)}<main class="page-shell geo-page" id="main">${body}</main>${footerMarkup(site)}<script src="/script.js" defer></script></body></html>`;
}

function headerMarkup(site) {
  return `<header class="site-header" data-header><a class="wordmark" href="/" aria-label="${escapeAttribute(site.client.brandName)} home"><span class="wordmark-mark" aria-hidden="true">❀</span><span>${escapeHtml(site.client.brandName)}</span></a><nav class="desktop-nav" aria-label="Primary navigation"><a href="/about">About</a><a href="/rates">Rates</a><a href="/travel">Travel</a><a href="/gallery">Gallery</a><a href="/reviews">Reviews</a></nav><div class="header-actions"><a class="header-cta" href="/contact">Let’s meet <span aria-hidden="true">↗</span></a><button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu">Menu</button></div></header><div class="mobile-menu" id="mobile-menu" data-mobile-menu hidden><nav aria-label="Mobile navigation"><a href="/about">About</a><a href="/rates">Rates</a><a href="/travel">Travel</a><a href="/date-ideas">Date ideas</a><a href="/singapore">Singapore</a><a href="/gallery">Gallery</a><a href="/reviews">Reviews</a><a href="/contact">Contact</a></nav></div>`;
}

function footerMarkup(site) {
  return `<footer class="site-footer"><div class="footer-brand"><span aria-hidden="true">❀</span><strong>${escapeHtml(site.client.brandName)}</strong></div><div class="footer-links"><a href="/about">About</a><a href="/travel">Travel</a><a href="/singapore">Singapore</a><a href="/date-ideas">Date ideas</a><a href="/reviews">Reviews</a><a href="/journal">Journal</a><a href="/press">Press</a><a href="/contact">Contact</a></div><div class="footer-meta"><span>© 2026 ${escapeHtml(site.client.brandName)}</span><span>Editorial location notes · Verify current venue details directly.</span></div></footer>`;
}

function breadcrumbMarkup(items) {
  return `<nav class="geo-breadcrumb" aria-label="Breadcrumb">${items.map((item, index) => index === items.length - 1 ? `<span aria-current="page">${escapeHtml(item.label)}</span>` : `<a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a><b aria-hidden="true">/</b>`).join('')}</nav>`;
}

function exploreRebeccaBand() {
  return `<section class="geo-explore-band"><div><p class="page-kicker">Beyond the neighbourhood</p><h2>The city is only part of the story.</h2></div><div class="geo-explore-links"><a href="/date-ideas">Date ideas <span>→</span></a><a href="/favourites">Food & favourites <span>→</span></a><a href="/travel">Travel <span>→</span></a><a href="/about">Meet Rebecca <span>→</span></a></div></section>`;
}

function countrySchema(site, geo) {
  const origin = site.deployment.origin;
  const pageUrl = absoluteUrl(origin, geo.country.path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': absoluteUrl(origin, '/') + '#website', url: absoluteUrl(origin, '/'), name: site.seo.siteName },
      { '@type': 'Person', '@id': absoluteUrl(origin, '/') + '#rebecca', name: site.client.publicName, url: absoluteUrl(origin, '/') },
      {
        '@type': 'WebPage',
        '@id': pageUrl + '#webpage',
        url: pageUrl,
        name: geo.country.title,
        description: geo.country.description,
        isPartOf: { '@id': absoluteUrl(origin, '/') + '#website' },
        author: { '@id': absoluteUrl(origin, '/') + '#rebecca' },
        about: { '@type': 'Place', name: geo.country.name }
      },
      breadcrumbSchema(origin, [
        { label: 'Home', path: '/' },
        { label: geo.country.name, path: geo.country.path }
      ])
    ]
  };
}

function microHubSchema(site, geo, hub) {
  const origin = site.deployment.origin;
  const path = `${geo.country.path}/${hub.slug}`;
  const pageUrl = absoluteUrl(origin, path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': absoluteUrl(origin, '/') + '#website', url: absoluteUrl(origin, '/'), name: site.seo.siteName },
      { '@type': 'Person', '@id': absoluteUrl(origin, '/') + '#rebecca', name: site.client.publicName, url: absoluteUrl(origin, '/') },
      {
        '@type': 'WebPage',
        '@id': pageUrl + '#webpage',
        url: pageUrl,
        name: hub.title,
        description: hub.description,
        isPartOf: { '@id': absoluteUrl(origin, geo.country.path) + '#webpage' },
        author: { '@id': absoluteUrl(origin, '/') + '#rebecca' },
        about: {
          '@type': 'Place',
          name: hub.name,
          containedInPlace: { '@type': 'Place', name: geo.country.name }
        }
      },
      breadcrumbSchema(origin, [
        { label: 'Home', path: '/' },
        { label: geo.country.name, path: geo.country.path },
        { label: hub.name, path }
      ])
    ]
  };
}

function breadcrumbSchema(origin, items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: absoluteUrl(origin, item.path)
    }))
  };
}

function editorialText(hub) {
  return [hub.hero, ...(hub.facts || []), ...(hub.sections || []).flatMap((section) => [section.heading, section.body])].join(' ');
}

function tokenSet(value) {
  return new Set(
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 3)
  );
}

export function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value);
}
