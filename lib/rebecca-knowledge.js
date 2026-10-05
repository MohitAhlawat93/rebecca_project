import {
  REBECCA_DATA,
  formatSingaporeRatesCompact,
  formatTouringRates,
  formatFmtySummary
} from '../data/rebecca-data.js';

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','been','but','by','can','could','do','does','for','from','had','has','have','her','here','how','i','if','in','is','it','its','me','my','of','on','or','our','please','rebecca','she','so','that','the','their','them','there','they','this','to','us','was','we','what','when','where','which','who','why','will','with','would','you','your'
]);

const SYNONYMS = {
  price: ['rate','rates','cost','consideration'],
  prices: ['rate','rates','cost','consideration'],
  cost: ['rate','rates','price','consideration'],
  book: ['booking','enquiry','contact'],
  booking: ['book','enquiry','contact','deposit'],
  available: ['availability','booking','contact'],
  availability: ['available','booking','contact'],
  tour: ['travel','touring','fmty'],
  touring: ['tour','travel','fmty'],
  fly: ['fmty','travel','touring'],
  gift: ['wishlist','flowers','wine','jewellery'],
  gifts: ['wishlist','flowers','wine','jewellery'],
  photo: ['photos','gallery','professional','selfies'],
  photos: ['photo','gallery','professional','selfies'],
  review: ['reviews','testimonial','reputation'],
  reviews: ['review','testimonial','reputation'],
  restaurant: ['food','dining','tasting','wine'],
  restaurants: ['food','dining','tasting','wine'],
  verify: ['screening','screen','verification'],
  id: ['screening','verification'],
  cancel: ['cancellation','deposit'],
  call: ['phone','screening'],
  couple: ['couples'],
  partner: ['couples'],
  hongkong: ['hong','kong'],
  hk: ['hong','kong']
};

const p=REBECCA_DATA.profile;
const sg=REBECCA_DATA.singapore;
const travel=REBECCA_DATA.travel;
const policies=REBECCA_DATA.policies;
const contact=REBECCA_DATA.contact;

export const REBECCA_KNOWLEDGE = [
  {
    id:'profile-core',
    title:'Rebecca — public profile',
    path:'/about',
    tags:['about','profile','age','height','base','education','language','style','personality'],
    text:`Risqué Rebecca is based in ${p.base} and has been established since ${p.establishedSince}. She is ${p.age.toLowerCase()}, ${p.height.metric} / ${p.height.imperial}, ${p.heritage}, speaks ${p.languages.join(' and ')}, and has a ${p.education.join(' and ')}. She has visited ${p.countriesVisited} countries and has lived, studied and worked across ${p.continentsLivedStudiedWorked} continents. Her style is ${p.style.join(', ')} and her public interests include ${p.interests.join(', ')}.`
  },
  {
    id:'singapore-rates',
    title:'Singapore rates',
    path:'/rates',
    tags:['singapore','rates','rate','price','cost','sgd','hours','overnight','extensions'],
    text:formatSingaporeRatesCompact()
  },
  {
    id:'singapore-terms',
    title:'Singapore booking details',
    path:'/rates',
    tags:['couples','hosting','phone','call','extension','room service'],
    text:`${sg.terms.threeHoursPlus} For private dates of ${sg.terms.longPrivate.minHours} hours or longer, add SGD ${sg.terms.longPrivate.surcharge.toLocaleString('en-US')} and include room service. Hosting starts from SGD ${sg.terms.hosting.from.toLocaleString('en-US')} with a ${sg.terms.hosting.minHours}-hour minimum and is reserved for ${sg.terms.hosting.eligibility}. Couples have a ${sg.terms.couples.minHours}-hour minimum and add SGD ${sg.terms.couples.surcharge.toLocaleString('en-US')}. A ${sg.terms.phoneCall.minutes}-minute phone call is SGD ${sg.terms.phoneCall.fee.toLocaleString('en-US')} and requires screening. Rates are fixed.`
  },
  {
    id:'fmty',
    title:'Fly me to you',
    path:'/travel',
    tags:['fmty','fly','travel','invite','asia','india','australia','europe','north america','africa','flights'],
    text:`Regional minimums: ${formatFmtySummary()} Selected Asia destinations: ${travel.fmty.find((item)=>item.id==='selected-asia').destinations.join(', ')}.`
  },
  {
    id:'travel-calendar',
    title:'Upcoming public travel calendar',
    path:'/travel',
    tags:['travel','calendar','tour','touring','dates','india','london','europe','north america','november','december'],
    text:`${travel.calendar.map((item)=>`${item.kicker}: ${item.body}`).join(' ')} ${travel.northAmericaNotice}`
  },
  {
    id:'india-rates',
    title:'India touring rates',
    path:'/travel',
    tags:['india','rates','price','inr','usd','touring'],
    text:formatTouringRates('India')
  },
  {
    id:'hong-kong-rates',
    title:'Hong Kong touring rates',
    path:'/travel',
    tags:['hong','kong','hk','rates','price','hkd','touring'],
    text:formatTouringRates('Hong Kong')
  },
  {
    id:'other-tour-rates',
    title:'Other touring rates',
    path:'/travel',
    tags:['london','usa','australia','china','rates','gbp','usd','aud','rmb'],
    text:['London: '+formatTouringRates('London'),'USA: '+formatTouringRates('USA'),'Australia: '+formatTouringRates('Australia'),'China: '+formatTouringRates('China')].join(' ')
  },
  {
    id:'screening',
    title:'Screening and privacy',
    path:'/etiquette',
    tags:['screening','verify','verification','linkedin','id','employment','privacy','documents'],
    text:`${policies.screening.paragraphs.join(' ')} ${policies.screening.conciergeNotice}`
  },
  {
    id:'deposits',
    title:'Deposits and cancellations',
    path:'/etiquette',
    tags:['deposit','deposits','cancel','cancellation','refund','reschedule'],
    text:`Deposits: ${policies.deposits.map((item)=>`${item.label} ${item.value}`).join('; ')}. Deposit timing: ${policies.depositTiming}. ${policies.cancellations.map((item)=>`${item.title}: ${item.body}`).join(' ')}`
  },
  {
    id:'boundaries',
    title:'Etiquette and boundaries',
    path:'/etiquette',
    tags:['etiquette','manners','boundary','boundaries','privacy','face','negotiation','outfit'],
    text:policies.boundaries.join(' ')
  },
  {
    id:'date-ideas',
    title:'Public date ideas',
    path:'/date-ideas',
    tags:['date','ideas','activity','spa','museum','theatre','karaoke','shopping','food'],
    text:`Public favourites include ${REBECCA_DATA.dateIdeas.public.join(', ')}. The private date list is reserved for confirmed suitors and must not be guessed or reconstructed.`
  },
  {
    id:'wishlist',
    title:'Wishlist and gifts',
    path:'/date-ideas',
    tags:['wishlist','gift','flowers','lingerie','wine','champagne','jewellery','food'],
    text:`Public favourites include flowers such as ${REBECCA_DATA.wishlist.flowers.join(', ')}; champagne houses such as ${REBECCA_DATA.wishlist.champagneHouses.join(', ')}; and ${REBECCA_DATA.wishlist.jewellery}.`
  },
  {
    id:'gallery',
    title:'Public photography archive',
    path:'/gallery',
    tags:['gallery','professional','selfies','candid','photo','photos','portfolio'],
    text:`The site is photo-only and contains ${REBECCA_DATA.gallery.professionalCount} professional photographs plus ${REBECCA_DATA.gallery.candidCount} candid photographs, ${REBECCA_DATA.gallery.totalCount} in total.`
  },
  {
    id:'reviews',
    title:'Public reviews and reputation',
    path:'/reviews',
    tags:['reviews','testimonial','reputation','established'],
    text:`Rebecca has been established since ${REBECCA_DATA.reputation.establishedSince}. Public review themes include ${REBECCA_DATA.reputation.themes.join(', ')}.`
  },
  {
    id:'contact',
    title:'Official contact',
    path:'/contact',
    tags:['contact','whatsapp','signal','imessage','telegram','email','enquiry','booking'],
    text:`Official channels: WhatsApp/iMessage/Signal ${contact.phoneDisplay}; Telegram ${contact.telegramHandle}; email ${contact.email}; Telegram channel ${contact.telegramChannelLabel}. Live availability is confirmed directly by ${contact.liveAvailabilityOwner}.`
  }
];

function normalize(text=''){
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
}

function queryTerms(query=''){
  const terms=new Set();
  for(const token of normalize(query).split(' ').filter(Boolean)){
    if(token.length<2||STOP_WORDS.has(token)) continue;
    terms.add(token);
    for(const synonym of SYNONYMS[token]||[]) terms.add(synonym);
  }
  return [...terms];
}

function scoreChunk(chunk,terms){
  const tags=normalize(chunk.tags.join(' '));
  const title=normalize(chunk.title);
  const body=normalize(chunk.text);
  let score=0;
  for(const term of terms){
    if(tags.includes(term)) score+=7;
    if(title.includes(term)) score+=5;
    score+=Math.min(body.split(term).length-1,4);
  }
  return score;
}

export function retrieveRebeccaKnowledge(query,limit=4){
  const terms=queryTerms(query);
  const ranked=REBECCA_KNOWLEDGE.map((chunk)=>({...chunk,score:scoreChunk(chunk,terms)})).sort((a,b)=>b.score-a.score);
  const relevant=ranked.filter((chunk)=>chunk.score>0).slice(0,limit);
  if(relevant.length) return relevant;
  return ['profile-core','contact'].map((id)=>REBECCA_KNOWLEDGE.find((chunk)=>chunk.id===id)).filter(Boolean);
}

export function formatRebeccaContext(chunks){
  return chunks.map((chunk,index)=>`[${index+1}] ${chunk.title} (${chunk.path})\n${chunk.text}`).join('\n\n');
}
