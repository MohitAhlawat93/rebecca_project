import fs from 'node:fs';
import { conciergePlan, parseBookingContext, draftEnquiry } from '../lib/concierge-planner.js';

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
assert(couple?.answer.includes('SGD 500'),'Couples surcharge was not included');
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

const script=fs.readFileSync('script.js','utf8');
assert(script.includes('page:currentPath'),'Client does not send page context');
assert(script.includes('renderChatActions'),'Client does not render structured actions');
assert(script.includes("matchMedia('(max-width: 640px)')"),'Mobile keyboard behavior is not guarded');

const css=fs.readFileSync('styles.css','utf8');
assert(css.includes('width:min(340px,calc(100vw - 40px))'),'Compact phone width rule is missing');
assert(css.includes('height:min(58svh,480px)'),'Compact phone height rule is missing');
assert(!css.includes('width:calc(100vw - 14px);height:calc(100svh - 14px)'),'Legacy near-full-screen mobile concierge rule remains');

if(!process.exitCode) console.log('Concierge 2.0 validation passed.');
