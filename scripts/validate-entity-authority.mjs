import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { routeIndex } from '../lib/seo-engine.mjs';
import {
  collectSchemaTypes,
  validateEntityAuthority
} from '../lib/entity-authority-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteConfigPath = path.resolve(root, process.env.CLIENT_CONFIG_PATH || 'seo/site.config.mjs');
const { default: site } = await import(pathToFileURL(siteConfigPath).href);
const entityConfigPath = path.resolve(
  root,
  site.entityAuthority?.module || 'seo/entity-authority.config.mjs'
);
const { ENTITY_AUTHORITY: authority } = await import(pathToFileURL(entityConfigPath).href);
const rendered = process.env.ENTITY_VALIDATE_RENDERED === 'true';

const validation = validateEntityAuthority(authority);
const errors = [...validation.errors];
for (const warning of validation.warnings) console.warn('Entity authority warning: ' + warning);

if (rendered) {
  const targets = routeIndex(site).filter(
    (route) => route.searchApproved && authority.pageMap[route.page.id]
  );
  const expectedSameAs = new Set(
    (authority.identity.verifiedSameAs || []).map((item) => item.url)
  );
  const relatedUrls = new Set(
    (authority.identity.relatedProfiles || []).map((item) => item.url)
  );

  for (const route of targets) {
    const full = path.join(root, route.file);
    let html = '';
    try {
      html = await fs.readFile(full, 'utf8');
    } catch {
      errors.push(route.file + ': missing rendered entity-authority page.');
      continue;
    }

    const scripts = [...html.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*data-entity-authority[^>]*>([\s\S]*?)<\/script>/gi
    )];

    if (scripts.length !== 1) {
      errors.push(route.file + ': expected exactly one entity authority graph, found ' + scripts.length + '.');
      continue;
    }

    let graph;
    try {
      graph = JSON.parse(scripts[0][1]);
    } catch {
      errors.push(route.file + ': entity authority JSON-LD is invalid JSON.');
      continue;
    }

    const nodes = Array.isArray(graph?.['@graph']) ? graph['@graph'] : [];
    const person = nodes.find((node) => node?.['@type'] === 'Person');
    const profile = nodes.find((node) => node?.['@type'] === 'ProfilePage');
    const types = collectSchemaTypes(graph);

    if (!person) errors.push(route.file + ': Person node is missing.');
    if (route.page.id === 'about' && !profile) {
      errors.push(route.file + ': About page must contain ProfilePage.');
    }
    if (route.page.id === 'home' && profile) {
      errors.push(route.file + ': homepage must not contain ProfilePage.');
    }

    const sameAs = new Set(person?.sameAs || []);
    for (const url of expectedSameAs) {
      if (!sameAs.has(url)) errors.push(route.file + ': missing verified sameAs ' + url);
    }
    for (const url of relatedUrls) {
      if (sameAs.has(url)) errors.push(route.file + ': related profile leaked into sameAs: ' + url);
    }

    if (route.page.id === 'reviews') {
      if (types.includes('Review')) errors.push(route.file + ': Review schema is prohibited by policy.');
      if (types.includes('AggregateRating')) {
        errors.push(route.file + ': AggregateRating schema is prohibited by policy.');
      }
    }

    if (route.page.id === 'press') {
      for (const item of authority.evidence.press || []) {
        if (!scripts[0][1].includes(item.url)) {
          errors.push(route.file + ': press evidence missing from graph: ' + item.url);
        }
      }
    }

    if (route.page.id === 'journal') {
      const articles = nodes
        .flatMap((node) => Array.isArray(node?.hasPart) ? node.hasPart : [])
        .filter((node) => node?.['@type'] === 'Article');
      if (articles.length !== (authority.evidence.authoredWorks || []).length) {
        errors.push(route.file + ': authored work count does not match evidence config.');
      }
      for (const article of articles) {
        if (!article.author?.['@id']?.endsWith(authority.entity.idSuffix)) {
          errors.push(route.file + ': authored Article is not linked to canonical Person.');
        }
      }
    }

    const legacyProfileScripts = [...html.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )].filter((match) => !/data-entity-authority/i.test(match[0]) && /ProfilePage|#rebecca/.test(match[1]));
    if (legacyProfileScripts.length) {
      errors.push(route.file + ': legacy duplicate Rebecca/ProfilePage graph remains.');
    }
  }
}

if (errors.length) {
  for (const error of errors) console.error('Entity authority validation failed: ' + error);
  process.exit(1);
}

console.log(
  'Entity authority validation passed. press=' +
  (authority.evidence.press || []).length +
  '; authored=' + (authority.evidence.authoredWorks || []).length +
  '; reviews=' + (authority.evidence.reviews || []).length +
  '; rendered=' + rendered
);
