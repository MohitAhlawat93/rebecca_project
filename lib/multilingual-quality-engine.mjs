export function localeStatus(config, language, page) {
  const pageStatus = language.pageSearchStatus?.[page.id];
  const wildcard = language.pageSearchStatus?.['*'];
  return pageStatus || wildcard || language.searchStatus || 'draft';
}

export function localeApproved(config, language, page) {
  const approvedStatus = config.multilingualQuality?.publishStatus || 'seo-approved';
  return localeStatus(config, language, page) === approvedStatus;
}

export function scriptRatio(text, locale) {
  const value = String(text || '');
  let target = 0;
  let comparable = 0;

  for (const char of value) {
    if (/\s|[0-9\p{P}\p{S}]/u.test(char)) continue;
    if (/\p{L}/u.test(char)) comparable += 1;
    if (locale === 'zh-CN' && /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(char)) target += 1;
    if (locale === 'hi' && /[\u0900-\u097f]/u.test(char)) target += 1;
  }

  return comparable ? target / comparable : 0;
}

export function textSimilarity(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / union.size;
}

export function extractVisibleText(html) {
  return String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt|#\d+|#x[a-f0-9]+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateLocaleQualityConfig(config) {
  const errors = [];
  const warnings = [];
  const quality = config.multilingualQuality;
  if (!quality) {
    warnings.push('No multilingual quality configuration is attached.');
    return { errors, warnings };
  }

  const statuses = new Set(quality.reviewWorkflow || []);
  if (!statuses.has(quality.publishStatus)) {
    errors.push('multilingual publishStatus must exist in reviewWorkflow.');
  }

  for (const language of config.languages || []) {
    const known = new Set([
      language.searchStatus,
      ...Object.values(language.pageSearchStatus || {})
    ].filter(Boolean));
    for (const status of known) {
      if (!statuses.has(status)) errors.push(`${language.id}: unknown multilingual status ${status}.`);
    }
  }

  return { errors, warnings };
}

function tokenSet(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 3)
  );
}
