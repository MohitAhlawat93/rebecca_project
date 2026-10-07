import { createHash } from 'node:crypto';
import { normalizeQuickControlState } from './admin-store.js';
import { normalizeConciergeControl } from './concierge-control-store.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const WEBSITE_KINDS = new Set(['availability','profile','rate','travel','contact','travel-add']);
const CONCIERGE_KINDS = new Set(['concierge-config','trusted-answer-add','trusted-answer-update']);

function cleanText(value, max = 400) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanBool(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function cleanNumber(value, fallback = null) {
  if (value === null || value === '' || typeof value === 'undefined') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1000000) return fallback;
  return Math.round(number);
}

function cleanArray(value, maxItems = 20, maxLength = 120) {
  const items = Array.isArray(value) ? value : String(value || '').split(',');
  return items.slice(0, maxItems).map((item) => cleanText(item, maxLength)).filter(Boolean);
}

function cleanPath(value) {
  const text = cleanText(value, 160);
  return text.startsWith('/') && !text.startsWith('//') ? text : '';
}

function dateKey(value) {
  const text = cleanText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function slug(value = '') {
  return cleanText(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function stableHash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
}

function websiteBasis(change, draft) {
  if (change.kind === 'availability') return draft.availability;
  if (change.kind === 'profile') return draft.profile;
  if (change.kind === 'contact') return draft.contact;
  if (change.kind === 'rate') return draft.rates.find((item) => item.id === change.id) || null;
  if (change.kind === 'travel') return draft.travel.find((item) => item.id === change.id) || null;
  if (change.kind === 'travel-add') return draft.travel.map((item) => item.id);
  return null;
}

function conciergeBasis(change, draft) {
  if (change.kind === 'concierge-config') {
    const { trustedAnswers, ...config } = draft;
    return config;
  }
  if (change.kind === 'trusted-answer-add') return draft.trustedAnswers.map((item) => item.id);
  if (change.kind === 'trusted-answer-update') {
    return draft.trustedAnswers.find((item) => item.id === change.id) || null;
  }
  return null;
}

function summarize(value) {
  if (value === null || typeof value === 'undefined') return 'Not set';
  if (Array.isArray(value)) return value.join(' · ') || 'None';
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, item]) => item !== '' && item !== null && typeof item !== 'undefined')
      .slice(0, 8)
      .map(([key, item]) => key + ': ' + (Array.isArray(item) ? item.join(', ') : String(item)))
      .join(' · ');
  }
  return String(value);
}

function availabilityPatch(raw = {}) {
  const out = {};
  const statuses = new Set(['accepting','limited','travelling','away','unavailable']);
  if (statuses.has(raw.status)) out.status = raw.status;
  if ('message' in raw) out.message = cleanText(raw.message, 280);
  if ('until' in raw) out.until = dateKey(raw.until);
  if (statuses.has(raw.revertStatus)) out.revertStatus = raw.revertStatus;
  if ('revertMessage' in raw) out.revertMessage = cleanText(raw.revertMessage, 280);
  return out;
}

function profilePatch(raw = {}) {
  const out = {};
  for (const [key, max] of Object.entries({
    displayName:100, base:100, secondaryBase:120, age:60,
    heightMetric:40, heightImperial:40, heritage:100
  })) {
    if (key in raw) out[key] = cleanText(raw[key], max);
  }
  if ('languages' in raw) out.languages = cleanArray(raw.languages, 10, 60);
  return out;
}

function contactPatch(raw = {}) {
  const out = {};
  for (const [key, max] of Object.entries({
    phoneDisplay:80, telegramHandle:80, email:180,
    telegramChannelLabel:100, telegramChannelUrl:500
  })) {
    if (key in raw) out[key] = cleanText(raw[key], max);
  }
  return out;
}

function ratePatch(raw = {}, base = {}) {
  const out = {};
  for (const [key, max] of Object.entries({
    label:100, short:60, display:80, category:100, note:180
  })) {
    if (key in raw) out[key] = cleanText(raw[key], max);
  }
  if ('amount' in raw) out.amount = cleanNumber(raw.amount, base.amount ?? null);
  if ('featured' in raw) out.featured = cleanBool(raw.featured, Boolean(base.featured));
  if ('visible' in raw) out.visible = cleanBool(raw.visible, base.visible !== false);
  return out;
}

function travelPatch(raw = {}, base = {}) {
  const out = {};
  for (const [key, max] of Object.entries({
    kicker:140, dateRange:140, title:180, body:800
  })) {
    if (key in raw) out[key] = cleanText(raw[key], max);
  }
  if ('startDate' in raw) out.startDate = dateKey(raw.startDate);
  if ('endDate' in raw) out.endDate = dateKey(raw.endDate);
  if ('cities' in raw) out.cities = cleanArray(raw.cities, 20, 80);
  if ('meta' in raw) out.meta = cleanArray(raw.meta, 12, 140);
  if ('alt' in raw) out.alt = cleanBool(raw.alt, Boolean(base.alt));
  if ('visible' in raw) out.visible = cleanBool(raw.visible, base.visible !== false);
  return out;
}

function conciergeConfigPatch(raw = {}) {
  const out = {};
  if ('enabled' in raw) out.enabled = cleanBool(raw.enabled, true);
  for (const [key, max] of Object.entries({
    displayName:80, subtitle:120, welcome:220, defaultIntro:300, pausedMessage:300
  })) {
    if (key in raw) out[key] = cleanText(raw[key], max);
  }
  return out;
}

function trustedAnswerPatch(raw = {}, base = {}) {
  const out = {};
  for (const [key, max] of Object.entries({
    question:220, answer:1200, linkLabel:80
  })) {
    if (key in raw) out[key] = cleanText(raw[key], max);
  }
  if ('keywords' in raw) out.keywords = cleanArray(raw.keywords, 20, 80).map((item) => item.toLowerCase());
  if ('linkPath' in raw) out.linkPath = cleanPath(raw.linkPath);
  if ('enabled' in raw) out.enabled = cleanBool(raw.enabled, base.enabled !== false);
  return out;
}

function makeTravelItem(raw = {}) {
  const title = cleanText(raw.title, 180);
  if (!title) return null;
  return {
    id: cleanText(raw.id, 100) || 'assistant-' + slug(title),
    kicker: cleanText(raw.kicker, 140),
    dateRange: cleanText(raw.dateRange, 140),
    startDate: dateKey(raw.startDate),
    endDate: dateKey(raw.endDate),
    title,
    cities: cleanArray(raw.cities, 20, 80),
    body: cleanText(raw.body, 800),
    meta: cleanArray(raw.meta, 12, 140),
    alt: Boolean(raw.alt),
    visible: raw.visible !== false
  };
}

function makeTrustedAnswer(raw = {}) {
  const question = cleanText(raw.question, 220);
  const answer = cleanText(raw.answer, 1200);
  if (!question || !answer) return null;
  return {
    id: cleanText(raw.id, 100) || 'assistant-' + slug(question),
    question,
    answer,
    keywords: cleanArray(raw.keywords, 20, 80).map((item) => item.toLowerCase()),
    linkPath: cleanPath(raw.linkPath),
    linkLabel: cleanText(raw.linkLabel, 80),
    enabled: raw.enabled !== false
  };
}

function assertKind(raw) {
  const target = raw?.target === 'concierge' ? 'concierge' : raw?.target === 'website' ? 'website' : '';
  const kind = cleanText(raw?.kind, 60);
  if (!target || !(target === 'website' ? WEBSITE_KINDS : CONCIERGE_KINDS).has(kind)) return null;
  return { target, kind };
}

export function applyAssistantChange(raw, {
  websiteDraft,
  conciergeDraft,
  enforceBasis = false
} = {}) {
  const type = assertKind(raw);
  if (!type) {
    const error = new Error('This proposed change is not supported.');
    error.code = 'ASSISTANT_CHANGE_INVALID';
    throw error;
  }

  const change = {
    target:type.target,
    kind:type.kind,
    id:cleanText(raw.id, 100),
    summary:cleanText(raw.summary, 220)
  };

  const currentBasis = change.target === 'website'
    ? websiteBasis(change, websiteDraft)
    : conciergeBasis(change, conciergeDraft);
  const basisHash = stableHash(currentBasis);

  if (enforceBasis && raw.basisHash && raw.basisHash !== basisHash) {
    const error = new Error('This proposal is stale because the Draft changed after it was created. Generate a fresh proposal.');
    error.code = 'ASSISTANT_PROPOSAL_STALE';
    throw error;
  }

  if (change.target === 'website') {
    const beforeDraft = normalizeQuickControlState(websiteDraft, websiteDraft);
    const next = clone(beforeDraft);
    let before;
    let after;

    if (change.kind === 'availability') {
      before = clone(next.availability);
      next.availability = { ...next.availability, ...availabilityPatch(raw.patch) };
    } else if (change.kind === 'profile') {
      before = clone(next.profile);
      next.profile = { ...next.profile, ...profilePatch(raw.patch) };
    } else if (change.kind === 'contact') {
      before = clone(next.contact);
      next.contact = { ...next.contact, ...contactPatch(raw.patch) };
    } else if (change.kind === 'rate') {
      const index = next.rates.findIndex((item) => item.id === change.id);
      if (index < 0) throw Object.assign(new Error('That rate no longer exists.'), { code:'ASSISTANT_CHANGE_INVALID' });
      before = clone(next.rates[index]);
      next.rates[index] = { ...next.rates[index], ...ratePatch(raw.patch, next.rates[index]) };
    } else if (change.kind === 'travel') {
      const index = next.travel.findIndex((item) => item.id === change.id);
      if (index < 0) throw Object.assign(new Error('That travel item no longer exists.'), { code:'ASSISTANT_CHANGE_INVALID' });
      before = clone(next.travel[index]);
      next.travel[index] = { ...next.travel[index], ...travelPatch(raw.patch, next.travel[index]) };
    } else if (change.kind === 'travel-add') {
      const item = makeTravelItem(raw.item || raw.patch);
      if (!item) throw Object.assign(new Error('A new travel item needs a title.'), { code:'ASSISTANT_CHANGE_INVALID' });
      if (next.travel.some((entry) => entry.id === item.id)) {
        item.id = item.id + '-' + stableHash(item).slice(0, 6);
      }
      before = null;
      next.travel.push(item);
    }

    const normalized = normalizeQuickControlState(next, beforeDraft);
    if (change.kind === 'availability') after = normalized.availability;
    if (change.kind === 'profile') after = normalized.profile;
    if (change.kind === 'contact') after = normalized.contact;
    if (change.kind === 'rate') after = normalized.rates.find((item) => item.id === change.id);
    if (change.kind === 'travel') after = normalized.travel.find((item) => item.id === change.id);
    if (change.kind === 'travel-add') after = normalized.travel[normalized.travel.length - 1];

    if (JSON.stringify(before) === JSON.stringify(after)) {
      const error = new Error('This proposal would not change the current Website Draft.');
      error.code = 'ASSISTANT_NO_CHANGE';
      throw error;
    }

    return {
      change:{
        ...change,
        patch:raw.patch ? clone(raw.patch) : undefined,
        item:raw.item ? clone(raw.item) : undefined,
        basisHash,
        summary:change.summary || 'Update Website Draft',
        before:summarize(before),
        after:summarize(after)
      },
      websiteDraft:normalized,
      conciergeDraft
    };
  }

  const beforeDraft = normalizeConciergeControl(conciergeDraft, conciergeDraft);
  const next = clone(beforeDraft);
  let before;
  let after;

  if (change.kind === 'concierge-config') {
    const { trustedAnswers, ...configBefore } = next;
    before = clone(configBefore);
    Object.assign(next, conciergeConfigPatch(raw.patch));
  } else if (change.kind === 'trusted-answer-add') {
    const item = makeTrustedAnswer(raw.item || raw.patch);
    if (!item) throw Object.assign(new Error('A Trusted Answer needs both a public question and answer.'), { code:'ASSISTANT_CHANGE_INVALID' });
    if (next.trustedAnswers.some((entry) => entry.id === item.id)) {
      item.id = item.id + '-' + stableHash(item).slice(0, 6);
    }
    before = null;
    next.trustedAnswers.push(item);
  } else if (change.kind === 'trusted-answer-update') {
    const index = next.trustedAnswers.findIndex((item) => item.id === change.id);
    if (index < 0) throw Object.assign(new Error('That Trusted Answer no longer exists.'), { code:'ASSISTANT_CHANGE_INVALID' });
    before = clone(next.trustedAnswers[index]);
    next.trustedAnswers[index] = {
      ...next.trustedAnswers[index],
      ...trustedAnswerPatch(raw.patch, next.trustedAnswers[index])
    };
  }

  const normalized = normalizeConciergeControl(next, beforeDraft);
  if (change.kind === 'concierge-config') {
    const { trustedAnswers, ...configAfter } = normalized;
    after = configAfter;
  }
  if (change.kind === 'trusted-answer-add') after = normalized.trustedAnswers[normalized.trustedAnswers.length - 1];
  if (change.kind === 'trusted-answer-update') after = normalized.trustedAnswers.find((item) => item.id === change.id);

  if (JSON.stringify(before) === JSON.stringify(after)) {
    const error = new Error('This proposal would not change the current Concierge Draft.');
    error.code = 'ASSISTANT_NO_CHANGE';
    throw error;
  }

  return {
    change:{
      ...change,
      patch:raw.patch ? clone(raw.patch) : undefined,
      item:raw.item ? clone(raw.item) : undefined,
      basisHash,
      summary:change.summary || 'Update Concierge Draft',
      before:summarize(before),
      after:summarize(after)
    },
    websiteDraft,
    conciergeDraft:normalized
  };
}

export function normalizeAssistantProposal(raw, states) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const inputChanges = Array.isArray(source.changes) ? source.changes.slice(0, 12) : [];
  let websiteDraft = clone(states.websiteDraft);
  let conciergeDraft = clone(states.conciergeDraft);
  const changes = [];

  for (const rawChange of inputChanges) {
    try {
      const applied = applyAssistantChange(rawChange, { websiteDraft, conciergeDraft });
      websiteDraft = applied.websiteDraft;
      conciergeDraft = applied.conciergeDraft;
      changes.push(applied.change);
    } catch {
      // Invalid or no-op model suggestions are dropped server-side.
    }
  }

  return {
    summary:cleanText(source.summary, 300) || (changes.length ? 'Review the proposed Draft changes below.' : 'I could not turn that request into a safe supported change.'),
    changes,
    unsupported:cleanText(source.unsupported, 300)
  };
}

export function assistantContext({ websiteDraft, conciergeDraft }) {
  return {
    website:{
      availability:websiteDraft.availability,
      profile:websiteDraft.profile,
      rates:websiteDraft.rates.map((item) => ({
        id:item.id,label:item.label,short:item.short,amount:item.amount,display:item.display,
        category:item.category,note:item.note,featured:item.featured,visible:item.visible
      })),
      travel:websiteDraft.travel.map((item) => ({
        id:item.id,title:item.title,dateRange:item.dateRange,startDate:item.startDate,endDate:item.endDate,
        cities:item.cities,body:item.body,meta:item.meta,visible:item.visible
      })),
      contact:websiteDraft.contact
    },
    concierge:{
      enabled:conciergeDraft.enabled,
      displayName:conciergeDraft.displayName,
      subtitle:conciergeDraft.subtitle,
      welcome:conciergeDraft.welcome,
      defaultIntro:conciergeDraft.defaultIntro,
      pausedMessage:conciergeDraft.pausedMessage,
      trustedAnswers:conciergeDraft.trustedAnswers.map((item) => ({
        id:item.id,question:item.question,answer:item.answer,keywords:item.keywords,
        linkPath:item.linkPath,linkLabel:item.linkLabel,enabled:item.enabled
      }))
    }
  };
}

function monthNumber(name='') {
  const months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
  return months[String(name).toLowerCase()] || null;
}

function parseLooseDate(prompt, year = new Date().getUTCFullYear()) {
  const iso = String(prompt).match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return iso[0];
  const named = String(prompt).toLowerCase().match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(20\d{2}))?\b/);
  if (!named) return null;
  const month=monthNumber(named[2]);
  const y=Number(named[3]||year), day=Number(named[1]);
  if (!month || day < 1 || day > 31) return null;
  return String(y).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}

export function deterministicAssistantProposal(prompt, { websiteDraft, conciergeDraft }, now = new Date()) {
  const text = String(prompt || '').trim();
  const q = text.toLowerCase();
  const changes = [];

  const statusMap=[
    ['not accepting','unavailable'],['unavailable','unavailable'],['away','away'],
    ['travelling','travelling'],['traveling','travelling'],['limited','limited'],['accepting','accepting']
  ];
  if (/availability|enquir/.test(q)) {
    const found=statusMap.find(([term])=>q.includes(term));
    if (found) {
      const patch={status:found[1]};
      const until=parseLooseDate(text,now.getUTCFullYear());
      if(until) patch.until=until;
      changes.push({target:'website',kind:'availability',patch,summary:'Update public availability'});
    }
  }

  const rateMatch=q.match(/\b(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs|h)\b[^\d]{0,30}(?:rate|price|to|=|at)?\s*(?:sgd\s*)?([0-9][0-9,]{2,})\b/);
  if(rateMatch){
    const duration=rateMatch[1];
    const rate=websiteDraft.rates.find((item)=>{
      const hay=(item.short+' '+item.label).toLowerCase();
      return hay.includes(duration+'h')||hay.includes(duration+' h')||hay.includes(duration+' hour');
    });
    if(rate){
      changes.push({
        target:'website',kind:'rate',id:rate.id,
        patch:{amount:Number(rateMatch[2].replaceAll(',','')),display:''},
        summary:'Update '+rate.label+' rate'
      });
    }
  }

  if(/pause|disable|turn off|stop/.test(q)&&/concierge|desk|ai/.test(q)){
    changes.push({target:'concierge',kind:'concierge-config',patch:{enabled:false},summary:'Pause Rebecca’s Desk'});
  }else if(/resume|enable|turn on|make live/.test(q)&&/concierge|desk|ai/.test(q)){
    changes.push({target:'concierge',kind:'concierge-config',patch:{enabled:true},summary:'Make Rebecca’s Desk live'});
  }

  return normalizeAssistantProposal({
    summary:changes.length?'I prepared the supported changes I could understand safely.':'I need a clearer supported request before I can prepare a Draft change.',
    changes,
    unsupported:changes.length?'':'Try availability, a current rate, travel details, profile/contact fields, or Concierge Control.'
  },{websiteDraft,conciergeDraft});
}
