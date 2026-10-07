import { absoluteUrl } from './seo-engine.mjs';

export function validateTravelAuthority(authority, getEvidence) {
  const errors = [];
  const warnings = [];
  const markets = authority?.markets || [];

  if (authority?.schemaVersion !== 1) errors.push('Unsupported travel authority schemaVersion.');
  if (!authority?.rootPath) errors.push('Travel authority rootPath is required.');
  if (!markets.length) errors.push('At least one persistent travel market is required.');
  if (authority?.launchLimit && markets.length > authority.launchLimit) {
    errors.push(`Travel authority has ${markets.length} markets, above launchLimit ${authority.launchLimit}.`);
  }

  const ids = new Set();
  const slugs = new Set();
  const titles = new Set();
  for (const market of markets) {
    if (!market.id || !market.slug || !market.name) errors.push('Every travel market needs id, slug and name.');
    if (ids.has(market.id)) errors.push(`Duplicate travel market id: ${market.id}`);
    if (slugs.has(market.slug)) errors.push(`Duplicate travel market slug: ${market.slug}`);
    if (titles.has(market.title)) errors.push(`Duplicate travel market title: ${market.title}`);
    ids.add(market.id);
    slugs.add(market.slug);
    titles.add(market.title);

    if (authority.prohibitDatedSlugs && looksDated(market.slug)) {
      errors.push(`${market.id}: dated/seasonal slug is prohibited: ${market.slug}`);
    }
    if (!market.title || !market.description) errors.push(`${market.id}: title and description are required.`);
    if (!Array.isArray(market.editorial) || market.editorial.length < 2) {
      errors.push(`${market.id}: needs at least two durable editorial sections.`);
    }

    const evidence = getEvidence(market);
    const evidenceCount =
      (evidence.rateSet ? 1 : 0) +
      (evidence.calendar?.length ? 1 : 0) +
      (evidence.sideTrips?.length ? 1 : 0);

    if (!evidenceCount) errors.push(`${market.id}: no canonical travel evidence exists.`);
    if (!evidence.rateSet) warnings.push(`${market.id}: no dedicated published rate set.`);

    for (const id of market.calendarIds || []) {
      if (!evidence.calendar.some((item) => item.id === id)) {
        errors.push(`${market.id}: missing canonical calendar entry ${id}.`);
      }
    }
    for (const key of market.sideTripKeys || []) {
      if (!evidence.sideTrips.some(([found]) => found === key)) {
        errors.push(`${market.id}: missing canonical side-trip rule ${key}.`);
      }
    }
  }

  return { errors, warnings };
}

export function renderTravelMarket(site, authority, market, evidence) {
  const path = `${authority.rootPath}/${market.slug}`;
  const canonical = absoluteUrl(site.deployment.origin, path);
  const status = travelStatus(authority.asOf, evidence.calendar || []);
  const rateMarkup = renderRates(evidence.rateSet);
  const tripMarkup = renderTrips(status);
  const sideTripMarkup = renderSideTrips(market, evidence.sideTrips || []);
  const cityCoverage = unique(
    (evidence.calendar || []).flatMap((item) => Array.isArray(item.cities) ? item.cities : [])
  );

  const cityMarkup = cityCoverage.length
    ? `<section class="travel-authority-section"><div class="travel-authority-heading"><p class="page-kicker">Current public coverage</p><h2>Cities in the present itinerary.</h2></div><div class="travel-city-chips">${cityCoverage.map((city) => `<span>${esc(city)}</span>`).join('')}</div><p class="travel-authority-note">These cities belong to one current ${esc(market.name)} travel entity rather than separate cloned landing pages.</p></section>`
    : '';

  const editorial = market.editorial.map((item, index) => `
    <article class="travel-authority-editorial">
      <span>0${index + 1}</span>
      <div><h2>${esc(item.heading)}</h2><p>${esc(item.body)}</p></div>
    </article>`).join('');

  const body = `
    ${breadcrumb([
      { label: 'Home', href: '/' },
      { label: 'Travel', href: authority.rootPath },
      { label: market.name, href: path }
    ])}
    <section class="travel-authority-hero">
      <div>
        <p class="page-kicker">${esc(market.eyebrow)}</p>
        <h1>${esc(market.name)}</h1>
      </div>
      <div class="travel-authority-hero-side">
        <p class="travel-authority-lead">${esc(market.hero)}</p>
        <p>${esc(market.intro)}</p>
      </div>
    </section>

    <section class="travel-authority-status">
      <div>
        <p class="page-kicker">Public travel status</p>
        <h2>${esc(status.heading)}</h2>
        <p>${esc(status.summary)}</p>
      </div>
      <div class="travel-window-list">${tripMarkup}</div>
    </section>

    ${cityMarkup}

    <section class="travel-authority-section">
      <div class="travel-authority-heading">
        <p class="page-kicker">Published rate set</p>
        <h2>Stable information, even when dates change.</h2>
      </div>
      <div class="travel-rate-panel">${rateMarkup}</div>
    </section>

    <section class="travel-authority-section">
      <div class="travel-authority-heading">
        <p class="page-kicker">Nearby invitations</p>
        <h2>Regional rules stay attached to the destination.</h2>
      </div>
      <div class="travel-side-rules">${sideTripMarkup}</div>
    </section>

    <section class="travel-authority-editorial-list">${editorial}</section>

    <section class="travel-authority-section travel-authority-source">
      <div class="travel-authority-heading">
        <p class="page-kicker">Canonical source</p>
        <h2>Dates update here. The URL does not.</h2>
      </div>
      <div class="travel-authority-prose">
        <p>This destination page is generated from Rebecca’s canonical public travel data. Public timing is intentionally approximate and can change; current details should be checked on the main travel page before relying on them.</p>
        <p><a class="inline-link" href="${attr(authority.source.url)}" target="_blank" rel="noopener noreferrer">${esc(authority.source.label)} <span aria-hidden="true">↗</span></a></p>
      </div>
    </section>

    <section class="geo-explore-band">
      <div><p class="page-kicker">Continue</p><h2>One travel system, not a pile of seasonal pages.</h2></div>
      <div class="geo-explore-links">
        <a href="/travel">Current travel calendar <span>→</span></a>
        <a href="/singapore">Singapore guide <span>→</span></a>
        <a href="/about">Meet Rebecca <span>→</span></a>
        <a href="/contact">Contact <span>→</span></a>
      </div>
    </section>
  `;

  return documentShell(site, {
    title: market.title,
    description: market.description,
    canonical,
    body,
    schema: schema(site, authority, market)
  });
}

export function travelStatus(asOf, entries) {
  const reference = String(asOf || '').slice(0, 10);
  if (!entries.length) {
    return {
      state: 'between-visits',
      heading: 'Between public visits',
      summary: 'No future public window is currently stored in the canonical travel calendar. The destination page remains useful for published rates, regional rules and future updates.',
      entries: []
    };
  }

  const enriched = entries.map((item) => {
    const start = item.startDate || '';
    const end = item.endDate || start;
    const state = !reference ? 'announced' : end < reference ? 'past' : start > reference ? 'upcoming' : 'current';
    return { ...item, state };
  });

  const live = enriched.filter((item) => item.state === 'current');
  const upcoming = enriched.filter((item) => item.state === 'upcoming');
  const active = [...live, ...upcoming];

  if (active.length) {
    return {
      state: live.length ? 'current' : 'upcoming',
      heading: live.length ? 'A public window is currently active' : 'A future public window is announced',
      summary: 'Public dates are planning signals rather than exact private logistics. The permanent destination URL stays the same before, during and after the trip.',
      entries: active
    };
  }

  return {
    state: 'past',
    heading: 'No future public window currently announced',
    summary: 'Previous public timing has passed, but this permanent page keeps the durable destination information and becomes the home for the next announcement.',
    entries: enriched
  };
}

function renderTrips(status) {
  if (!status.entries.length) {
    return '<div class="travel-window-empty"><strong>No future public dates stored</strong><span>Future announcements will appear on this same URL.</span></div>';
  }
  return status.entries.map((item) => `
    <article class="travel-window-card">
      <span>${esc(item.state)}</span>
      <strong>${esc(item.dateRange || [item.startDate, item.endDate].filter(Boolean).join(' – '))}</strong>
      <p>${esc(item.title || item.body || '')}</p>
    </article>`).join('');
}

function renderRates(rateSet) {
  if (!rateSet) return '<p>No dedicated rate set is currently published for this destination. Use the main travel page for the current rule.</p>';

  const minimum = rateSet.minimum
    ? `<div class="travel-rate-minimum"><span>Minimum</span><strong>${esc(rateSet.minimum)}</strong></div>`
    : '';
  const rows = (rateSet.items || []).map(([duration, price]) => `
    <div class="travel-rate-row"><span>${esc(duration)}</span><strong>${esc(price)}</strong></div>`).join('');
  const extension = rateSet.extension
    ? `<div class="travel-rate-extension"><span>Extension</span><strong>${esc(rateSet.extension)}</strong></div>`
    : '';
  return minimum + '<div class="travel-rate-list">' + rows + '</div>' + extension;
}

function renderSideTrips(market, sideTrips) {
  if (!sideTrips.length) {
    return '<div class="travel-side-rule"><span>Regional rule</span><strong>See the main travel page for current guidance.</strong></div>';
  }
  return sideTrips.map(([key, value]) => `
    <div class="travel-side-rule">
      <span>${esc(market.sideTripLabels?.[key] || key)}</span>
      <strong>${esc(value)}</strong>
    </div>`).join('');
}

function documentShell(site, { title, description, canonical, body, schema }) {
  const robots = site.deployment.indexingEnabled
    ? `index,follow,max-image-preview:${site.seo.maxImagePreview || 'large'}`
    : 'noindex,nofollow,noarchive';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5efe7"><meta name="description" content="${attr(description)}"><meta name="robots" content="${robots}"><meta property="og:site_name" content="${attr(site.seo.siteName)}"><meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${attr(canonical)}"><meta property="og:image" content="${attr(site.seo.defaultOgImage)}"><meta name="twitter:card" content="summary_large_image"><title>${esc(title)}</title><link rel="canonical" href="${attr(canonical)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Manrope:wght@300;400;500;600&display=swap" rel="stylesheet"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/site.webmanifest"><link rel="stylesheet" href="/styles.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body><a class="skip-link" href="#main">Skip to content</a>${header(site)}<main class="page-shell travel-authority-page" id="main">${body}</main>${footer(site)}<script src="/script.js" defer></script></body></html>`;
}

function header(site) {
  return `<header class="site-header" data-header><a class="wordmark" href="/" aria-label="${attr(site.client.brandName)} home"><span class="wordmark-mark" aria-hidden="true">❀</span><span>${esc(site.client.brandName)}</span></a><nav class="desktop-nav" aria-label="Primary navigation"><a href="/about">About</a><a href="/rates">Rates</a><a href="/travel">Travel</a><a href="/gallery">Gallery</a><a href="/reviews">Reviews</a></nav><div class="header-actions"><a class="header-cta" href="/contact">Let’s meet <span aria-hidden="true">↗</span></a><button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-menu">Menu</button></div></header><div class="mobile-menu" id="mobile-menu" data-mobile-menu hidden><nav aria-label="Mobile navigation"><a href="/about">About</a><a href="/rates">Rates</a><a href="/travel">Travel</a><a href="/singapore">Singapore</a><a href="/reviews">Reviews</a><a href="/contact">Contact</a></nav></div>`;
}

function footer(site) {
  return `<footer class="site-footer"><div class="footer-brand"><span aria-hidden="true">❀</span><strong>${esc(site.client.brandName)}</strong></div><div class="footer-links"><a href="/about">About</a><a href="/rates">Rates</a><a href="/travel">Travel</a><a href="/singapore">Singapore</a><a href="/reviews">Reviews</a><a href="/journal">Journal</a><a href="/press">Press</a><a href="/contact">Contact</a></div><div class="footer-meta"><span>© 2026 ${esc(site.client.brandName)}</span><span>Permanent destination hub · public timing remains approximate.</span></div></footer>`;
}

function breadcrumb(items) {
  return `<nav class="geo-breadcrumb" aria-label="Breadcrumb">${items.map((item, index) => index === items.length - 1 ? `<span aria-current="page">${esc(item.label)}</span>` : `<a href="${attr(item.href)}">${esc(item.label)}</a><b aria-hidden="true">/</b>`).join('')}</nav>`;
}

function schema(site, authority, market) {
  const origin = site.deployment.origin;
  const path = `${authority.rootPath}/${market.slug}`;
  const page = absoluteUrl(origin, path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': absoluteUrl(origin, '/') + '#website',
        url: absoluteUrl(origin, '/'),
        name: site.seo.siteName
      },
      {
        '@type': 'Person',
        '@id': absoluteUrl(origin, '/') + '#rebecca',
        name: site.client.publicName,
        url: absoluteUrl(origin, '/')
      },
      {
        '@type': 'WebPage',
        '@id': page + '#webpage',
        url: page,
        name: market.title,
        description: market.description,
        isPartOf: { '@id': absoluteUrl(origin, authority.rootPath) + '#webpage' },
        author: { '@id': absoluteUrl(origin, '/') + '#rebecca' },
        dateModified: authority.asOf,
        about: {
          '@type': 'Place',
          name: market.name,
          containedInPlace: market.country && market.country !== market.name
            ? { '@type': 'Country', name: market.country }
            : undefined
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          ['Home', '/'],
          ['Travel', authority.rootPath],
          [market.name, path]
        ].map(([name, item], index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name,
          item: absoluteUrl(origin, item)
        }))
      }
    ]
  };
}

function looksDated(slug) {
  return /(19|20)\d{2}|(?:^|-)(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|spring|summer|autumn|fall|winter)(?:-|$)/i.test(slug);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function esc(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function attr(value = '') {
  return esc(value);
}
