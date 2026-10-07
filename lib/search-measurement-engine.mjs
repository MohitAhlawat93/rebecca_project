export function normalizeMetricRow(input = {}) {
  const impressions = number(input.impressions);
  const clicks = number(input.clicks);
  const ctr = input.ctr == null ? ratio(clicks, impressions) : number(input.ctr);
  return {
    source: clean(input.source),
    surface: clean(input.surface || 'web'),
    date: clean(input.date),
    query: clean(input.query),
    page: clean(input.page),
    country: clean(input.country),
    device: clean(input.device),
    clicks,
    impressions,
    ctr,
    position: nullableNumber(input.position),
    citations: number(input.citations),
    citedPages: number(input.citedPages),
    topic: clean(input.topic),
    intent: clean(input.intent)
  };
}

export function normalizeGoogleRows(rows = [], { surface = 'web', dimensions = [] } = {}) {
  return rows.map((row) => {
    const values = {};
    (row.keys || []).forEach((value, index) => {
      values[dimensions[index]] = value;
    });
    return normalizeMetricRow({
      source: 'google',
      surface,
      date: values.date,
      query: values.query,
      page: values.page,
      country: values.country,
      device: values.device,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    });
  });
}

export function normalizeBingRows(rows = [], { surface = 'web' } = {}) {
  return rows.map((row) =>
    normalizeMetricRow({
      source: 'bing',
      surface,
      date: normalizeBingDate(row.Date || row.date),
      query: row.Query || row.query,
      page: row.Page || row.page || row.Url || row.url,
      clicks: row.Clicks ?? row.clicks,
      impressions: row.Impressions ?? row.impressions,
      position: row.AvgImpressionPosition ?? row.position,
      ctr: row.Ctr ?? row.ctr
    })
  );
}

export function normalizeGoogleGenerativeAiExport(rows = []) {
  return rows.map((row) =>
    normalizeMetricRow({
      source: 'google',
      surface: 'generative-ai',
      date: row.date || row.Date,
      page: row.page || row.Page,
      country: row.country || row.Country,
      device: row.device || row.Device,
      impressions: row.impressions ?? row.Impressions,
      clicks: row.clicks ?? row.Clicks
    })
  );
}

export function normalizeGoogleMultimodalExport(rows = []) {
  return rows.map((row) =>
    normalizeMetricRow({
      source: 'google',
      surface: 'multimodal',
      date: row.date || row.Date,
      page: row.page || row.Page,
      country: row.country || row.Country,
      device: row.device || row.Device,
      impressions: row.impressions ?? row.Impressions,
      clicks: row.clicks ?? row.Clicks
    })
  );
}

export function normalizeBingAiPerformance(rows = []) {
  return rows.map((row) =>
    normalizeMetricRow({
      source: 'bing',
      surface: 'ai-citation',
      date: row.date || row.Date,
      page: row.page || row.Page || row.url || row.Url,
      query: row.groundingQuery || row.GroundingQuery || row.query || row.Query,
      citations: row.citations ?? row.Citations ?? row.count ?? row.Count,
      citedPages: row.citedPages ?? row.CitedPages,
      topic: row.topic || row.Topic,
      intent: row.intent || row.Intent
    })
  );
}

export function summarizeSearchData(rows = []) {
  const totals = rows.reduce(
    (acc, row) => {
      const dimensionOnly = String(row.surface || '').endsWith('-query');
      if (!dimensionOnly) {
        acc.clicks += number(row.clicks);
        acc.impressions += number(row.impressions);
      }
      acc.citations += number(row.citations);
      if (row.page) acc.pages.add(row.page);
      if (row.query) acc.queries.add(row.query);
      return acc;
    },
    { clicks: 0, impressions: 0, citations: 0, pages: new Set(), queries: new Set() }
  );
  return {
    clicks: totals.clicks,
    impressions: totals.impressions,
    ctr: ratio(totals.clicks, totals.impressions),
    citations: totals.citations,
    uniquePages: totals.pages.size,
    uniqueQueries: totals.queries.size
  };
}

export function comparePeriods(current = [], previous = []) {
  const currentSummary = summarizeSearchData(current);
  const previousSummary = summarizeSearchData(previous);
  return {
    current: currentSummary,
    previous: previousSummary,
    delta: {
      clicks: delta(currentSummary.clicks, previousSummary.clicks),
      impressions: delta(currentSummary.impressions, previousSummary.impressions),
      ctr: delta(currentSummary.ctr, previousSummary.ctr),
      citations: delta(currentSummary.citations, previousSummary.citations)
    }
  };
}

export function buildSearchOpportunities(current = [], previous = [], config = {}) {
  const rules = config.reporting || config;
  const minImpressions = number(rules.minimumImpressions || 40);
  const minQueryImpressions = number(rules.minimumQueryImpressions || 20);
  const lowCtr = number(rules.lowCtrThreshold || 0.025);
  const minPosition = number(rules.strikingDistanceMinPosition || 4);
  const maxPosition = number(rules.strikingDistanceMaxPosition || 15);
  const change = number(rules.materialChangeRatio || 0.3);
  const maximum = number(rules.maximumRecommendations || 20);

  const opportunities = [];
  const currentPages = aggregate(current, 'page');
  const previousPages = aggregate(previous, 'page');
  const currentQueries = aggregate(current, 'query');
  const previousQueries = aggregate(previous, 'query');

  for (const item of currentPages.values()) {
    if (!item.key || item.impressions < minImpressions) continue;
    const prior = previousPages.get(item.key);

    if (
      item.ctr < lowCtr &&
      item.position != null &&
      item.position <= 10
    ) {
      opportunities.push(opportunity(
        'high-impressions-low-ctr',
        item,
        'Improve search-result appeal',
        'This page is already visible but earns relatively few clicks. Review title, description and intent match before adding more content.',
        'medium'
      ));
    }

    if (prior && prior.impressions > 0) {
      const impressionChange = delta(item.impressions, prior.impressions);
      const clickChange = delta(item.clicks, prior.clicks);
      if (impressionChange <= -change || clickChange <= -change) {
        opportunities.push(opportunity(
          'declining-page',
          item,
          'Investigate a meaningful decline',
          'Compare the page, search queries, indexing state and recent site/search changes before editing. Do not assume the cause.',
          'high',
          { impressionChange, clickChange }
        ));
      }
    }

    const imageSignals = current.filter(
      (row) =>
        row.page === item.key &&
        ['image', 'multimodal'].includes(row.surface) &&
        row.impressions > 0
    );
    if (imageSignals.length) {
      const visual = summarizeSearchData(imageSignals);
      if (visual.impressions >= minImpressions && visual.ctr < lowCtr) {
        opportunities.push(opportunity(
          'visual-discovery',
          item,
          'Improve visual discovery',
          'The page is appearing in image or multimodal search but click-through is weak. Review the representative image, surrounding context and landing-page fit.',
          'medium',
          { visualImpressions: visual.impressions, visualCtr: visual.ctr }
        ));
      }
    }
  }

  for (const item of currentQueries.values()) {
    if (!item.key || item.impressions < minQueryImpressions) continue;

    if (
      item.position != null &&
      item.position > minPosition &&
      item.position <= maxPosition
    ) {
      opportunities.push(opportunity(
        'striking-distance-query',
        item,
        'Strengthen an already-relevant query',
        'This query is close enough to merit focused improvement. Prefer improving the best existing page and internal links over creating a thin new landing page.',
        'medium'
      ));
    }

    const prior = previousQueries.get(item.key);
    if ((!prior || prior.impressions < minQueryImpressions / 2) && item.impressions >= minQueryImpressions) {
      opportunities.push(opportunity(
        'emerging-query',
        item,
        'Review an emerging search need',
        'This query is gaining visibility. Check whether the existing page fully answers the intent before considering new content.',
        'low'
      ));
    }
  }

  const aiRows = current.filter((row) => row.surface === 'ai-citation' && row.citations > 0);
  const aiPages = aggregate(aiRows, 'page');
  for (const item of aiPages.values()) {
    if (!item.key) continue;
    opportunities.push(opportunity(
      'ai-citation-strength',
      item,
      'Preserve content that earns AI citations',
      'This page is being cited in supported AI experiences. Protect its factual clarity, source evidence and stable URL when making changes.',
      'low',
      { citations: item.citations }
    ));
  }

  return dedupe(opportunities)
    .sort((a, b) => score(b) - score(a))
    .slice(0, maximum);
}

export function buildSearchIntelligence({
  current = [],
  previous = [],
  config = {},
  providerStatus = {}
} = {}) {
  const normalizedCurrent = current.map(normalizeMetricRow);
  const normalizedPrevious = previous.map(normalizeMetricRow);
  return {
    generatedAt: new Date().toISOString(),
    providerStatus,
    comparison: comparePeriods(normalizedCurrent, normalizedPrevious),
    opportunities: buildSearchOpportunities(normalizedCurrent, normalizedPrevious, config),
    surfaces: surfaceSummary(normalizedCurrent),
    topPages: top(aggregate(normalizedCurrent, 'page')),
    topQueries: top(aggregate(normalizedCurrent, 'query')),
    guardrails: {
      autoPublish: false,
      humanApprovalRequired: true,
      note: 'Search intelligence proposes investigation or improvements; it does not publish content automatically.'
    }
  };
}

export function surfaceSummary(rows = []) {
  const surfaces = new Map();
  for (const row of rows) {
    const key = [row.source || 'unknown', row.surface || 'unknown'].join(':');
    if (!surfaces.has(key)) surfaces.set(key, []);
    surfaces.get(key).push(row);
  }
  return [...surfaces.entries()].map(([key, values]) => {
    const [source, surface] = key.split(':');
    return { source, surface, ...summarizeSearchData(values) };
  });
}

function aggregate(rows, dimension) {
  const map = new Map();
  for (const row of rows) {
    const key = row[dimension];
    if (!key) continue;
    const current = map.get(key) || {
      key,
      clicks: 0,
      impressions: 0,
      citations: 0,
      weightedPosition: 0,
      positionWeight: 0
    };
    current.clicks += number(row.clicks);
    current.impressions += number(row.impressions);
    current.citations += number(row.citations);
    if (row.position != null && row.impressions > 0) {
      current.weightedPosition += row.position * row.impressions;
      current.positionWeight += row.impressions;
    }
    map.set(key, current);
  }

  for (const value of map.values()) {
    value.ctr = ratio(value.clicks, value.impressions);
    value.position = value.positionWeight
      ? value.weightedPosition / value.positionWeight
      : null;
  }
  return map;
}

function top(map, limit = 10) {
  return [...map.values()]
    .sort((a, b) => (b.clicks - a.clicks) || (b.impressions - a.impressions) || (b.citations - a.citations))
    .slice(0, limit)
    .map(stripInternal);
}

function opportunity(type, item, title, reason, priority, detail = {}) {
  return {
    id: type + ':' + stableKey(item.key),
    type,
    target: item.key,
    title,
    reason,
    priority,
    evidence: {
      clicks: item.clicks,
      impressions: item.impressions,
      ctr: item.ctr,
      position: item.position,
      citations: item.citations,
      ...detail
    },
    requiresReview: true
  };
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function score(item) {
  const priority = { high: 3, medium: 2, low: 1 }[item.priority] || 0;
  return priority * 100000 + number(item.evidence?.impressions) + number(item.evidence?.citations) * 100;
}

function stripInternal(value) {
  const { weightedPosition, positionWeight, ...cleaned } = value;
  return cleaned;
}

function normalizeBingDate(value) {
  const text = String(value || '');
  const legacy = text.match(/\/Date\((\d+)/);
  if (legacy) return new Date(Number(legacy[1])).toISOString().slice(0, 10);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
}

function stableKey(value) {
  let hash = 2166136261;
  for (const char of String(value || '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function clean(value) {
  return value == null ? '' : String(value).trim();
}

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function nullableNumber(value) {
  if (value == null || value === '') return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function ratio(left, right) {
  return right > 0 ? left / right : 0;
}

function delta(current, previous) {
  if (!previous) return current ? 1 : 0;
  return (current - previous) / Math.abs(previous);
}
