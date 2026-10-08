import fs from 'node:fs';
import { conciergePlan, parseBookingContext, draftEnquiry } from '../lib/concierge-planner.js';
import { generateConciergeAnswer } from '../api/concierge.js';
import { REBECCA_DATA } from '../data/rebecca-data.js';

const fail=(message)=>{console.error(`[Concierge 2.0 validation] ${message}`);process.exitCode=1;};
const assert=(condition,message)=>{if(!condition)fail(message);};

const singapore=conciergePlan("I'm in Singapore and want 4 hours for dinner.",[],'/rates');
assert(singapore?.answer.includes('SGD 3,200'),'Singapore 4h rate was not grounded correctly');
assert(singapore?.answer.includes('20–25%'),'Singapore deposit was not included');
assert(singapore?.actions?.some((a)=>a.label==='Draft my enquiry'),'Singapore plan is missing draft action');

const india=conciergePlan("I need 4 hours in Bangalore.",[],'/travel');
assert(india?.answer.includes('INR 260K / USD 2,800'),'Bangalore 4h rate was not grounded to India rates');
assert(india?.answer.includes('40%'),'Touring deposit was not included');

const dubai=conciergePlan("Can Rebecca come to Dubai for 4 hours?",[],'/travel');
assert(dubai?.answer.includes('48 hours + flights'),'Dubai FMTY minimum was not matched');
assert(dubai?.answer.includes('shorter than that published minimum'),'Short FMTY plan was not rejected');

const followupHistory=[{role:'user',content:'I will be in Singapore on 18 November.'},{role:'assistant',content:'Tell me the duration.'}];
const followup=conciergePlan('Actually make it 8 hours.',followupHistory,'/rates');
assert(followup?.answer.includes('SGD 5,000'),'Multi-turn duration update lost Singapore context');
assert(followup?.context?.date?.toLowerCase().includes('18 november'),'Multi-turn date context was not retained');

const couple=conciergePlan('We are a couple in Singapore and want 4 hours.',[],'/rates');
assert(couple?.answer.includes('SGD 800'),'Couples surcharge was not included');
assert(couple?.context?.rateSet==='Singapore','"two of us" style language must not be parsed as USA');

const incomplete=conciergePlan('Help me draft a complete enquiry.',[],'/contact');
assert(incomplete?.answer.includes('city/location'),'Incomplete draft did not request missing details');
assert(!incomplete?.actions?.some((a)=>a.label==='WhatsApp Rebecca'),'Incomplete draft should not jump directly to contact handoff');

const context=parseBookingContext('Singapore, 18 November, 4 hours, dinner.',[]);
const draft=draftEnquiry(context);
assert(draft.includes('Singapore'),'Draft did not include location');
assert(draft.includes('18 November'),'Draft did not include date');
assert(draft.includes('4 hours'),'Draft did not include duration');
assert(!/available|confirmed booking|accepted/i.test(draft),'Draft must not claim availability or confirmation');
const selectedAsia=conciergePlan('Can Rebecca come to Tokyo for 10 hours?',[],'/travel');
assert(selectedAsia?.answer.includes('14 hours + travel'),'Selected-Asia planner did not use the confirmed 14-hour minimum');

const petPeeves=await generateConciergeAnswer({message:'what are her pet peeves',history:[],page:'/about',language:'en',currentData:REBECCA_DATA});
assert(petPeeves.answer.includes('Bad manners'),'Public interview matcher missed pet peeves');

const favouriteCountries=await generateConciergeAnswer({message:'what are her favourite countries',history:[],page:'/about',language:'en',currentData:REBECCA_DATA});
assert(favouriteCountries.answer.includes('Uzbekistan')&&favouriteCountries.answer.includes('Japan'),'Favourite countries were matched to the wrong profile answer');

const generalDinner=await generateConciergeAnswer({message:'I am visiting Singapore, what is a classy first dinner idea?',history:[],page:'/',language:'en',currentData:REBECCA_DATA});
assert(generalDinner.mode!=='grounded-planner','General Singapore/date advice must not be hijacked by the booking planner');

const script=fs.readFileSync('script.js','utf8');
const api=fs.readFileSync('api/concierge.js','utf8');
const knowledge=fs.readFileSync('lib/rebecca-knowledge.js','utf8');
assert(script.includes('page:currentPath'),'Client does not send page context');
assert(script.includes('language:preferredLanguage'),'Client does not send preferred language');
assert(script.includes('Rebecca’s Desk'),'Rebecca’s Desk name is missing');
assert(script.includes('renderChatActions'),'Client does not render structured actions');
assert(script.includes("matchMedia('(max-width: 640px)')"),'Mobile keyboard behavior is not guarded');
assert(script.includes("button.dataset.afterhoursLauncher='true'"),'Persistent Rebecca Afterhours launcher is missing');
assert(script.includes("CHAT_SIZE_KEY='rr-concierge-size-v2'"),'Resizable concierge state is missing');
assert(script.includes('data-chat-size-toggle'),'Concierge resize menu is missing');
assert(script.includes('data-chat-resize-grip'),'Concierge drag resize grip is missing');
assert(script.includes('Rebecca Afterhours'),'Afterhours official-links panel is missing');
assert(!script.includes('twitter.com/risquerebecca')&&!script.includes('throne.com/risquerebecca'),'Unverified social links must not be hard-coded');
assert(api.includes('Attraction is subjective'),'Concierge lacks a helpful subjective-attraction response');
assert(api.includes("openai/gpt-oss-120b"),'Concierge is not using the stronger GPT-OSS 120B default');
assert(api.includes("reasoning_effort:'medium'"),'Concierge reasoning effort is not enabled');
assert(api.includes('FOCUSED PUBLIC CONTEXT'),'Concierge does not receive focused public context');
assert(api.includes('const RATE_MAX=30'),'Concierge rate limit was not raised for real conversation');
assert(api.includes('const bookingIntent='),'Booking planner is not gated by explicit booking intent');
assert(api.includes('\\bid\\b|identity'),'Suggestion routing must use a whole-word ID match so “idea” does not trigger privacy');
assert(api.includes('changing third-party facts'),'Concierge lacks safeguards for stale third-party facts');
assert(api.includes("qnaPool=["),'Concierge public FAQ/interview fallback matcher is missing');
assert(api.includes('favouriteCountriesMentioned'),'Concierge favourite-country fallback is missing');
assert(api.includes('data.updates?.channelLabel'),'Concierge public-updates fallback is missing');
assert(knowledge.includes("id:'profile-public-details'"),'Public profile details are missing from RAG knowledge');
assert(knowledge.includes("like: ['likes','favourites'"),'Broad like/interests retrieval synonyms are missing');
assert(knowledge.includes("id:'profile-faq'"),'Public FAQ knowledge chunk is missing');
assert(knowledge.includes("id:'site-index'"),'Website coverage index is missing');

const css=fs.readFileSync('styles.css','utf8');
assert(css.includes('width:min(340px,calc(100vw - 40px))'),'Compact phone width rule is missing');
assert(css.includes('height:min(58svh,480px)'),'Compact phone height rule is missing');
assert(!css.includes('width:calc(100vw - 14px);height:calc(100svh - 14px)'),'Legacy near-full-screen mobile concierge rule remains');
assert(css.includes("Rebecca's Desk — explicit desktop resizing"),'Desktop resize CSS is missing');
assert(css.includes('cursor:nwse-resize'),'Visible drag-resize affordance is missing');

if(!process.exitCode) console.log('Concierge 2.0 validation passed.');
