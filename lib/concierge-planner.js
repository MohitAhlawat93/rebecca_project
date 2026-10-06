import { REBECCA_DATA, formatSgd } from '../data/rebecca-data.js';

const MONTHS='January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';

const LOCATION_RULES=[
  {pattern:/\b(?:singapore|sg)\b/i,label:'Singapore',rateSet:'Singapore',mode:'singapore'},
  {pattern:/\b(?:bangalore|bengaluru|chennai|delhi|hyderabad|kolkata|mumbai|india)\b/i,label:null,rateSet:'India',mode:'touring'},
  {pattern:/\b(?:hong kong|\bhk\b)\b/i,label:'Hong Kong',rateSet:'Hong Kong',mode:'touring'},
  {pattern:/\b(?:london|united kingdom|\buk\b)\b/i,label:'London',rateSet:'London',mode:'touring'},
  {pattern:/\b(?:new york|nyc|los angeles|miami|san francisco|united states|usa|u\.s\.)\b/i,label:null,rateSet:'USA',mode:'touring'},
  {pattern:/\b(?:sydney|melbourne|brisbane|perth|australia)\b/i,label:null,rateSet:'Australia',mode:'touring'},
  {pattern:/\b(?:beijing|shanghai|shenzhen|guangzhou|china)\b/i,label:null,rateSet:'China',mode:'touring'},
  {pattern:/\b(?:dubai|abu dhabi|uae|middle east)\b/i,label:null,rateSet:null,mode:'fmty',fmtyId:'oceania-europe-middle-east'},
  {pattern:/\b(?:tokyo|japan|taipei|taiwan|macau|bali|bangkok|thailand|kuala lumpur|malaysia|maldives|ho chi minh|hanoi|manila|philippines|vietnam)\b/i,label:null,rateSet:null,mode:'fmty',fmtyId:'selected-asia'},
  {pattern:/\b(?:new zealand|oceania|europe)\b/i,label:null,rateSet:null,mode:'fmty',fmtyId:'oceania-europe-middle-east'},
  {pattern:/\b(?:canada|north america)\b/i,label:null,rateSet:null,mode:'fmty',fmtyId:'north-america'},
  {pattern:/\b(?:africa|south america|central america)\b/i,label:null,rateSet:null,mode:'fmty',fmtyId:'africa-south-central-america'}
];

function cleanLocationMatch(text,rule){
  const match=text.match(rule.pattern)?.[0];
  if(!match) return null;
  if(rule.label) return rule.label;
  return match.replace(/\b\w/g,(m)=>m.toUpperCase());
}

function extractDuration(text=''){
  if(/\bovernight\b/i.test(text)) return {hours:14.5,key:'14–15h',label:'14–15 hours'};
  if(/\b(?:full day|all day)\b/i.test(text)) return {hours:24,key:'24h',label:'24 hours'};
  const match=text.match(/\b(1\.5|2\.5|14\s*[-–]\s*15|48|24|18|15|14|8|6|4|3|2|1)\s*(?:hours?|hrs?|h)\b/i);
  if(!match) return null;
  const raw=match[1].replace(/\s/g,'').replace('-', '–');
  if(raw==='14–15') return {hours:14.5,key:'14–15h',label:'14–15 hours'};
  const hours=Number(raw);
  return {hours,key:`${raw}h`,label:`${raw} hour${hours===1?'':'s'}`};
}

function extractDatePhrase(text=''){
  const patterns=[
    new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})(?:\\s+\\d{4})?\\b`,'i'),
    new RegExp(`\\b(?:${MONTHS})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b`,'i'),
    /\b(?:today|tonight|tomorrow|this weekend|next weekend|this week|next week)\b/i
  ];
  for(const pattern of patterns){
    const match=text.match(pattern);
    if(match) return match[0];
  }
  return null;
}

function detectMood(text=''){
  const q=text.toLowerCase();
  if(/dinner|restaurant|tasting|wine|sushi|steak|food|cocktail/.test(q)) return {id:'eat',label:'food-focused',category:'Eat'};
  if(/spa|relax|quiet|hotel|beach/.test(q)) return {id:'disappear',label:'relaxed',category:'Disappear'};
  if(/museum|theatre|opera|exhibition|culture/.test(q)) return {id:'look',label:'cultural',category:'Look'};
  if(/go.?kart|arcade|karaoke|mini.?golf|escape room|playful/.test(q)) return {id:'play',label:'playful',category:'Play'};
  if(/pilates|yoga|padel|golf|fitness|active|workout/.test(q)) return {id:'move',label:'active',category:'Move'};
  return null;
}

function resolveLocation(text=''){
  for(const rule of LOCATION_RULES){
    if(rule.pattern.test(text)){
      return {...rule,location:cleanLocationMatch(text,rule)};
    }
  }
  return null;
}

function findSingaporeRate(duration){
  if(!duration) return null;
  const key=duration.key;
  return REBECCA_DATA.singapore.rates.find((item)=>item.short===key || (key==='15h'&&item.short==='14–15h') || (key==='14h'&&item.short==='14–15h') || (key==='48h'&&item.short==='Up to 48h'))||null;
}

function findTouringRate(setName,duration){
  if(!setName||!duration) return null;
  const set=REBECCA_DATA.travel.touringRates[setName];
  if(!set) return null;
  const keys=[duration.key];
  if(duration.key==='14h'||duration.key==='15h') keys.push('14–15h');
  const item=set.items.find(([d])=>keys.includes(d));
  return item?{duration:item[0],price:item[1],set}:null;
}

function fmtyFor(id){
  return REBECCA_DATA.travel.fmty.find((item)=>item.id===id)||null;
}

function minimumHours(text=''){
  if(/1 week/i.test(text)) return 168;
  const match=text.match(/(\d+(?:\.\d+)?)\s*hours?/i);
  return match?Number(match[1]):null;
}

function pageActions(page=''){
  if(page==='/rates') return [{type:'prompt',label:'Help me choose a duration',prompt:'Help me choose a duration for a first meeting.'}];
  if(page==='/travel') return [{type:'prompt',label:'Plan a travel enquiry',prompt:'Help me plan a travel enquiry. Ask only for the details you still need.'}];
  if(page==='/date-ideas') return [{type:'prompt',label:'Suggest a date style',prompt:'Suggest a date style based on Rebecca’s public preferences.'}];
  if(page==='/etiquette') return [{type:'prompt',label:'Explain screening',prompt:'Explain screening and deposits simply.'}];
  if(page==='/reviews') return [{type:'link',label:'Meet Rebecca',href:'/about'}];
  return [];
}

export function parseBookingContext(message='',history=[]){
  const userHistory=(Array.isArray(history)?history:[]).filter((item)=>item?.role==='user').map((item)=>String(item.content||''));
  const combined=[...userHistory,message].join(' ').slice(-3600);
  const current=String(message||'');
  const location=resolveLocation(combined);
  const duration=extractDuration(current)||extractDuration(combined);
  const date=extractDatePhrase(current)||extractDatePhrase(combined);
  const mood=detectMood(current)||detectMood(combined);
  const couple=/\b(?:couple|two of us|my partner|wife and i|husband and i|girlfriend and i|boyfriend and i)\b/i.test(combined);
  return {
    location:location?.location||null,
    rateSet:location?.rateSet||null,
    mode:location?.mode||null,
    fmtyId:location?.fmtyId||null,
    duration,
    date,
    mood,
    couple
  };
}

function depositFor(context){
  if(context.mode==='singapore') return REBECCA_DATA.policies.deposits.find((item)=>item.label==='Singapore')?.value||'20–25% minimum';
  if(context.mode==='touring') return REBECCA_DATA.policies.deposits.find((item)=>item.label==='Touring')?.value||'40% minimum';
  if(context.mode==='fmty') return REBECCA_DATA.policies.deposits.find((item)=>item.label==='Fly me to you')?.value||'50% + travel expenses';
  return null;
}

function dateIdeaFor(context){
  if(!context.mood) return null;
  return REBECCA_DATA.dateIdeas.categories.find((item)=>item.label===context.mood.category)||null;
}

export function draftEnquiry(context){
  const pieces=['Hi Rebecca,'];
  let plan='I’d love to enquire about meeting';
  if(context.location) plan+=` in ${context.location}`;
  if(context.date) plan+=` on ${context.date}`;
  if(context.duration) plan+=` for ${context.duration.label}`;
  plan+='.';
  pieces.push(plan);
  if(context.mood) pieces.push(`I’m leaning toward something ${context.mood.label}.`);
  if(context.couple) pieces.push('This would be for two of us.');
  pieces.push('I’m happy to complete screening privately through your verified channel and can send the required deposit once the details are agreed.');
  pieces.push('Please let me know if this could work for you. Thank you.');
  return pieces.join(' ');
}

function contactActions(draft){
  const contact=REBECCA_DATA.contact;
  return [
    {type:'link',label:'WhatsApp Rebecca',href:`${contact.whatsappUrl}?text=${encodeURIComponent(draft)}`,external:true},
    {type:'link',label:'Telegram Rebecca',href:contact.telegramUrl,external:true},
    {type:'link',label:'Email Rebecca',href:`mailto:${contact.email}?subject=${encodeURIComponent('Date enquiry for Risqué Rebecca')}&body=${encodeURIComponent(draft)}`,external:true},
    {type:'copy',label:'Copy enquiry',text:draft}
  ];
}

export function conciergePlan(message='',history=[],page=''){
  const context=parseBookingContext(message,history);
  const q=String(message||'').toLowerCase();

  if(/draft|write|prepare/.test(q) && /enquir|message|booking|intro/.test(q)){
    const missing=[
      !context.location?'city/location':null,
      !context.duration?'duration':null,
      !context.date?'preferred date or window':null
    ].filter(Boolean);
    if(missing.length>=2){
      return {
        answer:`I can draft it. First send me your ${missing.join(', ')} in one message. Please don’t send screening documents here.`,
        context,
        actions:[{type:'link',label:'View rates',href:'/rates'},{type:'link',label:'Travel guidance',href:'/travel'}]
      };
    }
    const draft=draftEnquiry(context);
    return {
      answer:`Here’s a clean draft you can send directly to Rebecca:\n\n${draft}\n\nRebecca confirms live availability herself.`,
      context,
      draft,
      actions:contactActions(draft)
    };
  }

  if(/recommend|first meeting|what should we do|date idea/.test(q)&&!context.mood){
    return {
      answer:'Rebecca’s public date ideas work best by mood. Choose food-focused, relaxed, playful or cultural and I’ll narrow it down without inventing anything from her private list.',
      context,
      actions:[
        {type:'prompt',label:'Food-focused',prompt:'Suggest a food-focused first date using Rebecca’s public preferences.'},
        {type:'prompt',label:'Relaxed',prompt:'Suggest a relaxed first date using Rebecca’s public preferences.'},
        {type:'prompt',label:'Playful',prompt:'Suggest a playful first date using Rebecca’s public preferences.'},
        {type:'prompt',label:'Cultural',prompt:'Suggest a cultural first date using Rebecca’s public preferences.'}
      ]
    };
  }

  const hasPlanningSignal=Boolean(context.location||context.duration||context.date||context.mood||(context.couple&&(context.location||context.duration)));
  const asksPlanning=/book|enquir|meet|visit|coming|want|need|recommend|first meeting|dinner|overnight|hours?|couple|available|availability|rate|price|cost/.test(q);
  if(!hasPlanningSignal||!asksPlanning) return null;

  const lines=[];
  let rateFound=false;

  if(context.mode==='singapore'&&context.duration){
    const rate=findSingaporeRate(context.duration);
    if(rate){
      rateFound=true;
      lines.push(`For ${rate.label} in Singapore, Rebecca’s published rate is ${formatSgd(rate.amount)}${rate.note?` (${rate.note})`:''}.`);
      if(context.couple) lines.push(`For couples, the published terms add SGD ${REBECCA_DATA.singapore.terms.couples.surcharge.toLocaleString('en-US')} with a ${REBECCA_DATA.singapore.terms.couples.minHours}-hour minimum.`);
    }else{
      lines.push(`I don’t see an exact published Singapore rate for ${context.duration.label}, so I won’t invent one. The Rates page has the current duration table.`);
    }
  }

  if(context.mode==='touring'&&context.duration){
    const rate=findTouringRate(context.rateSet,context.duration);
    if(rate){
      rateFound=true;
      lines.push(`${context.location||context.rateSet} uses Rebecca’s ${context.rateSet} touring rates: ${rate.duration} is ${rate.price}.`);
    }else{
      lines.push(`I don’t see ${context.duration.label} in Rebecca’s published ${context.rateSet} touring table, so I won’t invent a rate.`);
    }
  }

  if(context.mode==='fmty'){
    const fmty=fmtyFor(context.fmtyId);
    if(fmty){
      const min=minimumHours(fmty.minimum);
      const tooShort=context.duration&&min&&context.duration.hours<min;
      lines.push(`${context.location||fmty.label} falls under Rebecca’s fly-me-to-you guidance: the public minimum is ${fmty.minimum}.`);
      if(tooShort) lines.push(`Your ${context.duration.label} plan is shorter than that published minimum, so I wouldn’t imply an exception.`);
    }
  }

  if(context.location&&!context.duration&&context.mode==='touring'){
    lines.push(`${context.location} is covered by Rebecca’s ${context.rateSet} touring guidance. Tell me the duration and I can match the published rate.`);
  }else if(context.location&&!context.duration&&context.mode==='singapore'){
    lines.push('Tell me roughly how long you have in mind and I can match Rebecca’s published Singapore rate.');
  }

  if(context.duration&&!context.location&&!rateFound){
    lines.push(`I have ${context.duration.label}. Tell me the city and I can match the relevant public rate or travel minimum.`);
  }

  const idea=dateIdeaFor(context);
  if(idea) lines.push(`For the date itself, Rebecca’s “${idea.label}” mood fits: ${idea.body}`);

  const deposit=depositFor(context);
  if(deposit) lines.push(`The relevant published deposit is ${deposit}, and screening is required.`);
  else lines.push('Screening is required before a date is confirmed.');

  lines.push('I can help prepare the enquiry, but Rebecca confirms live availability herself.');

  const actions=[
    {type:'prompt',label:'Draft my enquiry',prompt:'Draft my enquiry using what I have already told you.'},
    ...(context.mood?[]:[{type:'link',label:'Date ideas',href:'/date-ideas'}]),
    {type:'link',label:'Contact Rebecca',href:'/contact'},
    ...pageActions(page)
  ];

  return {answer:lines.join(' '),context,actions};
}

export function conciergePagePrompts(page=''){
  const common=[
    {label:'Singapore rates',prompt:"What are Rebecca's Singapore rates?"},
    {label:'Screening',prompt:'How does screening work?'},
    {label:'Travel',prompt:'Can Rebecca travel to me?'}
  ];
  const map={
    '/rates':[
      {label:'Choose a duration',prompt:'Help me choose a duration for a first meeting.'},
      {label:'Couples',prompt:'What are the published terms for couples?'},
      {label:'Singapore rates',prompt:"What are Rebecca's Singapore rates?"}
    ],
    '/travel':[
      {label:'Plan my city',prompt:'I want Rebecca to visit my city. What details do you need?'},
      {label:'India',prompt:'What are Rebecca’s India rates?'},
      {label:'FMTY',prompt:'Explain Rebecca’s fly-me-to-you minimums.'}
    ],
    '/date-ideas':[
      {label:'Food-focused',prompt:'Suggest a food-focused date using Rebecca’s public preferences.'},
      {label:'Relaxed',prompt:'Suggest a relaxed date using Rebecca’s public preferences.'},
      {label:'Playful',prompt:'Suggest a playful date using Rebecca’s public preferences.'}
    ],
    '/etiquette':[
      {label:'Screening',prompt:'Explain screening simply.'},
      {label:'Deposits',prompt:'Explain Rebecca’s deposits.'},
      {label:'Cancellations',prompt:'Explain Rebecca’s cancellation policy.'}
    ],
    '/contact':[
      {label:'Draft enquiry',prompt:'Help me draft a complete enquiry.'},
      {label:'What to include',prompt:'What should I include in my enquiry?'},
      {label:'Screening',prompt:'How does screening work?'}
    ]
  };
  return map[page]||common;
}
