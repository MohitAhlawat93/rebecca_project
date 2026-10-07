import {
  REBECCA_DATA,
  formatSingaporeRatesCompact,
  formatTouringRates,
  formatFmtySummary
} from '../data/rebecca-data.js';
import { liveDateKey } from './live-content.js';

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
  hk: ['hong','kong'],
  like: ['likes','favourites','favorites','interests','food','wine'],
  likes: ['like','favourites','favorites','interests','food','wine'],
  love: ['likes','favourites','favorites','interests'],
  loves: ['likes','favourites','favorites','interests'],
  enjoy: ['likes','favourites','favorites','interests'],
  enjoys: ['likes','favourites','favorites','interests'],
  hobby: ['interests','favourites','favorites'],
  hobbies: ['interests','favourites','favorites'],
  interest: ['interests','favourites','favorites'],
  interests: ['favourites','favorites','personality'],
  hot: ['gallery','reviews','beautiful','stunning','profile'],
  sexy: ['gallery','reviews','profile'],
  beautiful: ['gallery','reviews','stunning','profile'],
  attractive: ['gallery','reviews','profile']
};

export function buildRebeccaKnowledge(data = REBECCA_DATA){
  const p=data.profile;
  const sg=data.singapore;
  const travel=data.travel;
  const policies=data.policies;
  const contact=data.contact;
  const availability=data.availability||{
    label:'Availability',
    message:'Final live availability is confirmed directly by Rebecca.'
  };
  const today=liveDateKey();
  const currentNotices=(data.notices||[]).filter((item)=>item?.enabled!==false
    && (!item.startDate||today>=item.startDate)
    && (!item.expiryDate||today<=item.expiryDate));

  return [
  {
    id:'profile-core',
    title:'Rebecca — public profile',
    path:'/about',
    tags:['about','profile','age','height','base','education','language','style','personality','interests','likes','hobbies'],
    text:`Risqué Rebecca is based in ${p.base} and has been established since ${p.establishedSince}. She is ${p.age.toLowerCase()}, ${p.height.metric} / ${p.height.imperial}, ${p.heritage}, speaks ${p.languages.join(' and ')}, and has a ${p.education.join(' and ')}. She has visited ${p.countriesVisited} countries and has lived, studied and worked across ${p.continentsLivedStudiedWorked} continents. Her style is ${p.style.join(', ')} and her public interests include ${p.interests.join(', ')}.`
  },
  {
    id:'profile-public-details',
    title:'Rebecca — publicly listed personal details',
    path:'/about',
    tags:['profile','details','dress','shoe','bra','sexuality','bisexual','switchy','smoking','drinking','background','athlete','pianist'],
    text:`Publicly listed details: dress size ${p.publicDetails.dressSize}; shoe size ${p.publicDetails.shoeSize}; bra size ${p.publicDetails.braSize}; sexuality ${p.publicDetails.sexuality}; dynamic ${p.publicDetails.dynamic}; smoking ${p.publicDetails.smoking}; drinking ${p.publicDetails.drinking}; background ${p.publicDetails.background.join(', ')}.`
  },
  {
    id:'profile-personality',
    title:'Rebecca — personality and interview',
    path:'/about',
    tags:['personality','interview','strengths','weaknesses','happiness','pet peeves','date','conversation','romantic','values'],
    text:`${p.philosophy.title} ${p.philosophy.body} ${p.interview.map((item)=>`${item.question} ${item.answer}`).join(' ')}`
  },
  {
    id:'availability',
    title:'Current public availability status',
    path:'/contact',
    tags:['availability','available','enquiry','booking','status','today','tonight'],
    text:`${availability.label}. ${availability.message} Final live availability is always confirmed directly by Rebecca.`
  },
  {
    id:'singapore-rates',
    title:'Singapore rates',
    path:'/rates',
    tags:['singapore','rates','rate','price','cost','sgd','hours','overnight','extensions'],
    text:formatSingaporeRatesCompact(data)
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
    text:`Regional minimums: ${formatFmtySummary(data)} Selected Asia destinations: ${travel.fmty.find((item)=>item.id==='selected-asia').destinations.join(', ')}.`
  },
  {
    id:'travel-calendar',
    title:'Published travel calendar',
    path:'/travel',
    tags:['travel','calendar','tour','touring','dates','india','london','europe','north america','november','december','upcoming','past'],
    text:`${travel.calendar.filter((item)=>item.visible!==false).map((item)=>`${item.kicker || item.title}: ${item.body} Public window: ${item.dateRange || [item.startDate,item.endDate].filter(Boolean).join(' to ')}.`).join(' ')} These are broad public tour windows, not live location tracking. Exact timing and physical location are not public.`
  },
  {
    id:'travel-interest',
    title:'Expressions of interest',
    path:'/travel',
    tags:['travel','interest','expression','north america','future tour','cities'],
    text:`${(travel.expressionsOfInterest||[]).filter((item)=>item.visible!==false).map((item)=>`${item.region || item.title}: ${item.body}`).join(' ')} Expressions of interest are not confirmed tour dates and do not indicate Rebecca’s current location.`
  },
  {
    id:'travel-map',
    title:'Rebecca around the world — verified public map',
    path:'/travel',
    tags:['map','visited','favourite','favorite','countries','travel history','singapore','hong kong','uzbekistan','japan','bolivia','czech republic'],
    text:`Rebecca publicly says she has visited ${p.countriesVisited} countries, but the map deliberately shows only specifically evidenced places. Verified published map references: ${(travel.mapLocations||[]).filter((item)=>item.enabled!==false).map((item)=>`${item.name} [${(item.categories||[]).join(', ')}]: ${item.summary}`).join(' ')} The map must never be used to infer a live/current physical location.`
  },
  {
    id:'live-notices',
    title:'Current public website notices',
    path:'/',
    tags:['notice','announcement','afterhours','telegram','update','tour update'],
    text:`${currentNotices.map((item)=>`${item.title}: ${item.message}`).join(' ')} Notices are public site information only and do not prove live availability or current physical location.`
  },
  {
    id:'india-rates',
    title:'India touring rates',
    path:'/travel',
    tags:['india','rates','price','inr','usd','touring'],
    text:formatTouringRates('India',data)
  },
  {
    id:'hong-kong-rates',
    title:'Hong Kong touring rates',
    path:'/travel',
    tags:['hong','kong','hk','rates','price','hkd','touring'],
    text:formatTouringRates('Hong Kong',data)
  },
  {
    id:'other-tour-rates',
    title:'Other touring rates',
    path:'/travel',
    tags:['london','usa','australia','china','rates','gbp','usd','aud','rmb'],
    text:['London: '+formatTouringRates('London',data),'USA: '+formatTouringRates('USA',data),'Australia: '+formatTouringRates('Australia',data),'China: '+formatTouringRates('China',data)].join(' ')
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
    text:`Rebecca likes dates with texture and a point of view. ${data.dateIdeas.categories.map((item)=>`${item.label}: ${item.body}`).join(' ')} The private date list is reserved for confirmed suitors and must not be guessed or reconstructed.`
  },
  {
    id:'wishlist',
    title:'Wishlist and gifts',
    path:'/date-ideas',
    tags:['wishlist','gift','flowers','lingerie','wine','champagne','jewellery','food'],
    text:`Gifts are never required. ${data.wishlist.categories.map((item)=>`${item.label}: ${item.body}`).join(' ')}`
  },
  {
    id:'favourites',
    title:'Rebecca — food, wine and favourites',
    path:'/favourites',
    tags:['favourites','favorites','likes','love','enjoys','hobbies','food','wine','champagne','drinks','flowers','lingerie','fashion','gifts','jewellery','interests'],
    text:`Food: ${data.wishlist.food.join(', ')}. Champagne: ${data.wishlist.champagneHouses.join(', ')}. Wine interests: ${data.wishlist.wineInterests.join(', ')}. Drinks: ${data.wishlist.drinks.join(', ')}. Flowers: ${data.wishlist.flowers.join(', ')}. Lingerie: ${data.wishlist.lingerie.join(', ')}. Fashion: ${data.wishlist.fashion.join(', ')}. Gift cards: ${data.wishlist.giftCards.join(', ')}. Jewellery: ${data.wishlist.jewellery}. Conversation interests: ${data.profile.interests.join(', ')}.`
  },
  {
    id:'gallery',
    title:'Public photography archive',
    path:'/gallery',
    tags:['gallery','professional','selfies','candid','photo','photos','portfolio'],
    text:`The site is photo-only and contains ${data.gallery.professionalCount} professional photographs plus ${data.gallery.candidCount} candid photographs, ${data.gallery.totalCount} in total.`
  },
  {
    id:'reviews',
    title:'Public reviews and reputation',
    path:'/reviews',
    tags:['reviews','testimonial','reputation','established','ivy','ter','scarlet','trust','history'],
    text:`Rebecca has been established since ${data.reputation.establishedSince}. Her public review record spans ${data.reputation.proofPoints.find((item)=>item.label==='Public review span').value} and includes Ivy Societe, TER, Scarlet Blue and AussieAffairs. Public review themes include ${data.reputation.themes.join(', ')}. Review archive: ${data.reputation.reviews.map((review)=>`${review.source} ${review.date}: ${review.excerpt}`).join(' ')}`
  },
  {
    id:'press',
    title:'Press and public appearances',
    path:'/press',
    tags:['press','media','appearance','interview','vogue','vice','rice','profile'],
    text:data.press.appearances.map((item)=>`${item.outlet} ${item.year}: ${item.title}. ${item.note}`).join(' ')
  },
  {
    id:'journal',
    title:'Public writing and musings',
    path:'/journal',
    tags:['journal','blog','musings','writing','essay','rice','love','identity','privacy'],
    text:data.journal.entries.map((item)=>`${item.title} (${item.year}, ${item.outlet}). ${item.note}`).join(' ')
  },
  {
    id:'expanded-etiquette',
    title:'Additional etiquette and touring practicalities',
    path:'/etiquette',
    tags:['hosting','communication','inclusivity','accessibility','references','touring','hotel','privacy'],
    text:policies.expanded.map((item)=>`${item.title}: ${item.body}`).join(' ')
  },
  {
    id:'travel-side-trips',
    title:'Tour side-trip minimums',
    path:'/travel',
    tags:['side trip','london','europe','hong kong','japan','korea','india','sri lanka','maldives','australia','oceania'],
    text:Object.entries(travel.tourSideMinimums).map(([key,value])=>`${key}: ${value}`).join('; ')
  },
  {
    id:'contact',
    title:'Official contact',
    path:'/contact',
    tags:['contact','whatsapp','signal','imessage','telegram','email','enquiry','booking'],
    text:`Official channels: WhatsApp/iMessage/Signal ${contact.phoneDisplay}; Telegram ${contact.telegramHandle}; email ${contact.email}; Telegram channel ${contact.telegramChannelLabel}. Live availability is confirmed directly by ${contact.liveAvailabilityOwner}.`
  }

  ];
}

export const REBECCA_KNOWLEDGE = buildRebeccaKnowledge(REBECCA_DATA);

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

export function retrieveRebeccaKnowledge(query,limit=4,data=REBECCA_DATA){
  const knowledge=buildRebeccaKnowledge(data);
  const terms=queryTerms(query);
  const ranked=knowledge.map((chunk)=>({...chunk,score:scoreChunk(chunk,terms)})).sort((a,b)=>b.score-a.score);
  const relevant=ranked.filter((chunk)=>chunk.score>0).slice(0,limit);
  if(relevant.length) return relevant;
  return ['profile-core','contact'].map((id)=>knowledge.find((chunk)=>chunk.id===id)).filter(Boolean);
}

export function formatRebeccaContext(chunks){
  return chunks.map((chunk,index)=>`[${index+1}] ${chunk.title} (${chunk.path})\n${chunk.text}`).join('\n\n');
}
