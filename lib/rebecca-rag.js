import {
  REBECCA_DATA,
  formatSingaporeRatesCompact,
  formatTouringRates,
  formatFmtySummary,
  formatCalendarSummary,
  formatDepositSummary
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
  video: ['videos','selfies','gallery','candid'],
  videos: ['video','selfies','gallery','candid'],
  photo: ['photos','gallery','professional','selfies'],
  photos: ['photo','gallery','professional','selfies'],
  review: ['reviews','testimonial','reputation'],
  reviews: ['review','testimonial','reputation'],
  date: ['dates','activity','restaurant','hotel'],
  dates: ['date','activity','restaurant','hotel'],
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

const p = REBECCA_DATA.profile;
const sg = REBECCA_DATA.singapore;
const travel = REBECCA_DATA.travel;
const policies = REBECCA_DATA.policies;
const contact = REBECCA_DATA.contact;
const wishlist = REBECCA_DATA.wishlist;

const cancellationText = policies.cancellations.map((item) => `${item.title}: ${item.body}`).join(' ');
const boundariesText = policies.boundaries.join(' ');
const screeningText = policies.screening.paragraphs.join(' ');
const wishlistText = [
  `Lingerie: ${wishlist.lingerie.join(', ')}.`,
  `Flowers: ${wishlist.flowers.join(', ')}.`,
  `Fashion: ${wishlist.fashion.join(', ')}.`,
  `Gift cards: ${wishlist.giftCards.join(', ')}.`,
  `Drinks: ${wishlist.drinks.join(', ')}.`,
  `Food: ${wishlist.food.join(', ')}.`,
  wishlist.jewellery + '.'
].join(' ');

export const REBECCA_RAG_CHUNKS = [
  {
    id: 'profile-core',
    title: 'Rebecca — public profile',
    path: '/about',
    tags: ['about','profile','age','height','base','education','language','nationality','ethnicity','style','personality'],
    text: `Risqué Rebecca is a ${p.base}-based professional companion established since ${p.establishedSince}. She is in her ${p.age.toLowerCase()}, ${p.height.metric} / ${p.height.imperial}, ${p.heritage}, fluent in ${p.languages.join(' and ')}, with a ${p.education.join(' and ')}. She describes herself as ${p.descriptors.join(', ')}. Her style is ${p.style.join(', ')}. She has visited ${p.countriesVisited} countries and has lived, studied and worked across ${p.continentsLivedStudiedWorked} continents.`
  },
  {
    id: 'profile-extra',
    title: 'Rebecca — additional public profile details',
    path: '/about',
    tags: ['physique','measurements','dress','shoe','smoking','drinking','sexuality','bisexual','switchy','accent','body'],
    text: `Rebecca’s public profile describes her as ${p.height.metric} / ${p.height.imperial}, approximately ${p.publicDetails.dressSize}, with ${p.publicDetails.shoeSize} shoes and a ${p.publicDetails.braSize} bra size. She publicly identifies as ${p.publicDetails.sexuality} and ${p.publicDetails.dynamic}. She is a ${p.publicDetails.smoking} and ${p.publicDetails.drinking}. These are public profile details only; the concierge must not infer or add anything beyond what Rebecca has chosen to publish.`
  },
  {
    id: 'profile-interests',
    title: 'Rebecca — interests and tastes',
    path: '/about',
    tags: ['interests','food','wine','books','reading','fitness','travel','culture','f1','cars','fashion','hobbies','passions'],
    text: `Rebecca reads several books at once and enjoys ${[...p.interests, ...p.extendedInterests].join(', ')}. She is a ${p.publicDetails.background.join(' and ')}. Favourite countries she has mentioned include ${p.favouriteCountriesMentioned.join(', ')}.`
  },
  {
    id: 'singapore-rates',
    title: 'Singapore rates',
    path: '/rates',
    tags: ['singapore','rates','rate','price','cost','consideration','sgd','hours','overnight','extensions'],
    text: formatSingaporeRatesCompact()
  },
  {
    id: 'singapore-terms',
    title: 'Singapore booking details',
    path: '/rates',
    tags: ['couples','hosting','privacy','phone','call','extension','risque','experience','room service','activity'],
    text: `${sg.terms.threeHoursPlus} For dates of ${sg.terms.longPrivate.minHours} hours or longer that stay completely private, add SGD ${sg.terms.longPrivate.surcharge.toLocaleString('en-US')} and include room service. Singapore hosting starts from SGD ${sg.terms.hosting.from.toLocaleString('en-US')} with a ${sg.terms.hosting.minHours}-hour minimum; it is ${sg.terms.hosting.frequency} and reserved for ${sg.terms.hosting.eligibility}. Couples have a ${sg.terms.couples.minHours}-hour minimum and add SGD ${sg.terms.couples.surcharge.toLocaleString('en-US')}. Enhanced bespoke experiences typically begin from +SGD ${sg.terms.bespokeAdditionsFrom.toLocaleString('en-US')} above standard rates. A ${sg.terms.phoneCall.minutes}-minute phone call is SGD ${sg.terms.phoneCall.fee.toLocaleString('en-US')} and requires screening. Rates are not negotiable.`
  },
  {
    id: 'fmty-general',
    title: 'Fly me to you — regional minimums',
    path: '/travel',
    tags: ['fmty','fly','travel','invite','asia','india','australia','europe','middle east','dubai','uae','north america','africa','south america','flights'],
    text: `Fly-me-to-you minimums: ${formatFmtySummary()} Selected Asia destinations are ${travel.fmty.find((item) => item.id === 'selected-asia').destinations.join(', ')}. ${travel.comfort} where possible.`
  },
  {
    id: 'tour-calendar',
    title: 'Upcoming public travel calendar',
    path: '/travel',
    tags: ['travel','calendar','tour','touring','dates','india','london','europe','north america','november','december'],
    text: formatCalendarSummary()
  },
  {
    id: 'tour-domestic-minimums',
    title: 'Tour-side FMTY minimums',
    path: '/travel',
    tags: ['travel','fmty','london','uk','europe','hong kong','china','japan','korea','usa','india','sri lanka','maldives','australia','oceania'],
    text: `Published tour-side minimums: from London to Greater UK or major European cities, ${travel.tourSideMinimums.londonToUkEurope}; from Hong Kong to China/Japan/Korea, ${travel.tourSideMinimums.hongKongToChinaJapanKorea}; domestic USA FMTY, ${travel.tourSideMinimums.domesticUsa}; domestic China, ${travel.tourSideMinimums.domesticChina}; domestic India, ${travel.tourSideMinimums.domesticIndia}; India to Sri Lanka/Maldives, ${travel.tourSideMinimums.indiaToSriLankaMaldives}; domestic Australia, ${travel.tourSideMinimums.domesticAustralia}; Australia to other parts of Oceania, ${travel.tourSideMinimums.australiaToOceania}.`
  },
  {
    id: 'india-rates',
    title: 'India touring rates',
    path: '/travel',
    tags: ['india','rates','rate','price','inr','usd','touring'],
    text: formatTouringRates('India')
  },
  {
    id: 'hong-kong-rates',
    title: 'Hong Kong touring rates',
    path: '/travel',
    tags: ['hong','kong','hk','rates','rate','price','hkd','touring'],
    text: formatTouringRates('Hong Kong')
  },
  {
    id: 'other-tour-rates',
    title: 'Other published touring rates',
    path: '/travel',
    tags: ['london','usa','america','australia','china','rates','gbp','usd','aud','rmb'],
    text: [
      'London: ' + formatTouringRates('London'),
      'USA: ' + formatTouringRates('USA'),
      'Australia: ' + formatTouringRates('Australia'),
      'China: ' + formatTouringRates('China'),
      travel.practicalities[2]
    ].join(' ')
  },
  {
    id: 'screening',
    title: 'Screening and privacy',
    path: '/etiquette',
    tags: ['screening','screen','verify','verification','linkedin','id','employment','privacy','documents'],
    text: `${screeningText} ${policies.screening.conciergeNotice}`
  },
  {
    id: 'deposits-cancellations',
    title: 'Deposits and cancellations',
    path: '/etiquette',
    tags: ['deposit','deposits','cancel','cancellation','refund','reschedule','touring','hosting'],
    text: `All confirmed dates require deposits, including repeat meetings. ${formatDepositSummary()} Deposit is requested ${policies.depositTiming}. ${cancellationText}`
  },
  {
    id: 'etiquette',
    title: 'Etiquette and boundaries',
    path: '/etiquette',
    tags: ['etiquette','manners','boundary','boundaries','privacy','selfie','face','off clock','negotiation','outfit'],
    text: boundariesText
  },
  {
    id: 'date-ideas-public',
    title: 'Public date ideas',
    path: '/date-ideas',
    tags: ['date','ideas','activity','activities','spa','movie','museum','theatre','karaoke','kart','arcade','beach','fitness','shopping'],
    text: `Rebecca enjoys dates with an activity and is comfortable in settings from casual bars to three-star Michelin restaurants. Public favourites include ${REBECCA_DATA.dateIdeas.public.join(', ')}. She has a separate highly curated private list of frequented date spots for confirmed suitors; the concierge must not reveal or invent the locked list.`
  },
  {
    id: 'wishlist',
    title: 'Wishlist and gifts',
    path: '/date-ideas',
    tags: ['wishlist','gift','gifts','flowers','lingerie','wine','champagne','jewellery','watch','spa','food','throne'],
    text: `Gifts are never expected. ${wishlistText}`
  },
  {
    id: 'food-drink',
    title: 'Food and drink favourites',
    path: '/date-ideas',
    tags: ['food','wine','champagne','whisky','tequila','fruit','restaurant','tasting','krug','bordeaux'],
    text: `Champagne houses Rebecca has named include ${wishlist.champagneHouses.join(', ')}. Wine interests include ${wishlist.wineInterests.join(', ')}. She takes whisky or tequila neat.`
  },
  {
    id: 'media-archive',
    title: 'Public photography archive',
    path: '/gallery',
    tags: ['gallery','professional','selfies','candid','photo','photos','video','videos','portfolio','media'],
    text: `Rebecca’s new site is intentionally photo-only. It preserves ${REBECCA_DATA.gallery.professionalCount} public professional photographs at ${REBECCA_DATA.gallery.professionalPath} and ${REBECCA_DATA.gallery.candidCount} public candid/selfie photographs at ${REBECCA_DATA.gallery.candidPath}, for ${REBECCA_DATA.gallery.totalCount} public photographs in total. Rebecca does not publicly show her face and does not send extra private selfies on request. The new site does not publish video.`
  },
  {
    id: 'reviews-reputation',
    title: 'Public reviews and reputation',
    path: '/reviews',
    tags: ['reviews','review','testimonial','testimonials','reputation','ivy','scarlet','ter','established'],
    text: `Rebecca has been established since ${REBECCA_DATA.reputation.establishedSince} and publishes reviews spanning multiple years. Public reviews repeatedly describe her as ${REBECCA_DATA.reputation.themes.join(', ')}.`
  },
  {
    id: 'contact',
    title: 'Official contact and enquiries',
    path: '/contact',
    tags: ['contact','whatsapp','signal','imessage','telegram','email','enquiry','booking'],
    text: `Official channels: WhatsApp/iMessage/Signal ${contact.phoneDisplay}; Telegram ${contact.telegramHandle}; Telegram channel ${contact.telegramChannelUrl}; email ${contact.email}. Live availability and booking confirmation come directly from ${contact.liveAvailabilityOwner}. Complete enquiries should include preferred date/window, duration, location and a screening route.`
  },
  {
    id: 'faq-first-meeting',
    title: 'First meeting and expectations',
    path: '/about',
    tags: ['first','new','newbie','expect','expectation','impression','pda','real','scam'],
    text: `Rebecca welcomes respectful newcomers who can read and follow the booking instructions. She values thoughtful gestures, reliability, efficiency and consistency. Her long-running public reviews and established-since-${p.establishedSince} presence provide the practical reputation context.`
  }
];

function normalize(text='') {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function queryTerms(query='') {
  const raw = normalize(query).split(' ').filter(Boolean);
  const terms = new Set();
  for (const token of raw) {
    if (token.length < 2 || STOP_WORDS.has(token)) continue;
    terms.add(token);
    for (const synonym of SYNONYMS[token] || []) terms.add(synonym);
  }
  return [...terms];
}

function scoreChunk(chunk, terms) {
  const tags = normalize(chunk.tags.join(' '));
  const title = normalize(chunk.title);
  const body = normalize(chunk.text);
  let score = 0;
  for (const term of terms) {
    if (tags.includes(term)) score += 7;
    if (title.includes(term)) score += 5;
    const bodyMatches = body.split(term).length - 1;
    score += Math.min(bodyMatches, 4);
  }
  return score;
}

export function retrieveRebeccaKnowledge(query, limit=4) {
  const terms = queryTerms(query);
  const ranked = REBECCA_RAG_CHUNKS
    .map((chunk) => ({ ...chunk, score: scoreChunk(chunk, terms) }))
    .sort((a,b) => b.score - a.score);

  const relevant = ranked.filter((chunk) => chunk.score > 0).slice(0, limit);
  if (relevant.length) return relevant;

  return ['profile-core','contact']
    .map((id) => REBECCA_RAG_CHUNKS.find((chunk) => chunk.id === id))
    .filter(Boolean);
}

export function formatRebeccaContext(chunks) {
  return chunks.map((chunk, index) =>
    `[${index + 1}] ${chunk.title} (${chunk.path})\n${chunk.text}`
  ).join('\n\n');
}
