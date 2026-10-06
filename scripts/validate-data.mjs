import { readFileSync, existsSync } from 'node:fs';
import { REBECCA_DATA, formatSingaporeRatesCompact, formatFmtySummary } from '../data/rebecca-data.js';
import { REBECCA_KNOWLEDGE } from '../lib/rebecca-knowledge.js';

const fail=(message)=>{throw new Error('[Rebecca data validation] '+message);};
const assert=(condition,message)=>{if(!condition) fail(message);};

const { profile, singapore, travel, policies, contact }=REBECCA_DATA;

assert(profile.displayName && profile.establishedSince,'profile core fields are required');
assert(profile.languages.length>=1,'at least one language is required');
assert(profile.homeFacts.length>=5 && profile.aboutFacts.length>=5,'profile fact sets are incomplete');
assert(profile.interview?.length>=5,'profile interview is incomplete');
assert(profile.philosophy?.title && profile.philosophy?.body,'profile philosophy is incomplete');

assert(singapore.rates.length>=1,'Singapore rates are required');
const rateLabels=new Set();
for(const rate of singapore.rates){
  assert(rate.label,'every Singapore rate needs a label');
  assert(!rateLabels.has(rate.label),'duplicate Singapore rate label: '+rate.label);
  rateLabels.add(rate.label);
  if(rate.amount!=null) assert(Number.isFinite(rate.amount)&&rate.amount>0,'invalid amount for '+rate.label);
}
assert(Number.isFinite(singapore.extensionPerHour)&&singapore.extensionPerHour>0,'extension amount is invalid');
assert(Number.isFinite(singapore.terms.couples.surcharge),'couples surcharge is missing');
assert(typeof singapore.terms.phoneCall.creditTowardBooking==='boolean','phone-call credit flag must be explicit');
assert(singapore.terms.couples.surcharge===800,'confirmed couples surcharge must be SGD 800');
assert(singapore.terms.phoneCall.creditTowardBooking===true,'confirmed phone-call credit must be enabled');
assert(travel.fmty.find((item)=>item.id==='selected-asia')?.minimum==='14 hours + travel','confirmed selected-Asia FMTY minimum must be 14 hours + travel');

assert(travel.calendar.length>=1,'travel calendar is empty');
assert(travel.fmty.length>=1,'FMTY rules are empty');
for(const item of travel.fmty) assert(item.id&&item.label&&item.minimum,'incomplete FMTY rule');
for(const [name,set] of Object.entries(travel.touringRates)){
  assert(set.items?.length,'touring rates missing for '+name);
  assert(set.extension,'touring extension missing for '+name);
}

assert(policies.screening.required===true,'screening should be explicitly required');
assert(policies.deposits.length>=3,'deposit rules are incomplete');
assert(policies.cancellations.length>=1,'cancellation rules are missing');
assert(policies.boundaries.length>=1,'boundary rules are missing');

assert(contact.email.includes('@'),'contact email is invalid');
assert(contact.whatsappUrl.startsWith('https://wa.me/'),'WhatsApp URL is invalid');
assert(contact.telegramUrl.startsWith('https://t.me/'),'Telegram URL is invalid');
assert(REBECCA_DATA.reputation.proofPoints?.length>=4,'reputation proof points are incomplete');
assert(REBECCA_DATA.reputation.reviews?.length>=12,'review history is incomplete');
assert(REBECCA_DATA.press.appearances?.length>=4,'press archive is incomplete');
assert(REBECCA_DATA.journal.entries?.length>=3,'journal archive is incomplete');
assert(REBECCA_DATA.profile.fragments?.length>=6,'profile fragments are incomplete');
assert(REBECCA_DATA.profile.faq?.length>=4,'profile FAQ is incomplete');
assert(REBECCA_DATA.policies.expanded?.length>=5,'expanded etiquette is incomplete');
assert(REBECCA_DATA.wishlist.details?.length>=5,'wishlist details are incomplete');
assert(REBECCA_DATA.dateIdeas.categories?.length>=5,'date idea categories are incomplete');
assert(REBECCA_DATA.wishlist.categories?.length>=5,'wishlist categories are incomplete');

const knowledgeText=REBECCA_KNOWLEDGE.map((chunk)=>chunk.text).join('\n');
assert(knowledgeText.includes(formatSingaporeRatesCompact()),'RAG Singapore rates are not derived from canonical data');
assert(knowledgeText.includes(formatFmtySummary()),'RAG FMTY rules are not derived from canonical data');

const requiredBindings={
  'index.html':['data-profile-hero-meta','data-profile-home-facts'],
  'about.html':['data-profile-about-facts','data-profile-philosophy','data-profile-interview','data-profile-fragments','data-profile-faq'],
  'reviews.html':['data-reputation-proof','data-reputation-reviews'],
  'journal.html':['data-journal-entries'],
  'press.html':['data-press-appearances'],
  'favourites.html':['data-favourites-table','data-favourites-things','data-favourites-interests'],
  'date-ideas.html':['data-date-categories','data-wishlist-categories','data-wishlist-details','data-wishlist-links'],
  'rates.html':['data-singapore-rates','data-singapore-terms','data-asia-promo'],
  'travel.html':['data-travel-calendar','data-fmty-grid','data-touring-rates','data-travel-side-trips','data-travel-practicalities'],
  'etiquette.html':['data-screening-policy','data-deposit-grid','data-cancellation-policy','data-boundaries-policy','data-etiquette-more'],
  'contact.html':['data-contact-channels','data-duration-options','data-screening-options']
};
const pressHtml=readFileSync(new URL('../press.html',import.meta.url),'utf8');
assert(!pressHtml.includes('data-external-profiles'),'Press external profiles must stay hidden from the public page');

for(const [file,bindings] of Object.entries(requiredBindings)){
  const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  for(const binding of bindings) assert(html.includes(binding),file+' is missing '+binding);
  assert(html.includes('/content.js'),file+' is missing canonical-data renderer');
}

const script=readFileSync(new URL('../script.js',import.meta.url),'utf8');
assert(script.includes("fetch('/api/concierge'"),'client is not using canonical-data concierge endpoint');
assert(!existsSync(new URL('../api/chat.js',import.meta.url)),'legacy api/chat.js should not exist');
assert(!existsSync(new URL('../lib/rebecca-rag.js',import.meta.url)),'legacy lib/rebecca-rag.js should not exist');

console.log('Rebecca canonical data validation passed.');
