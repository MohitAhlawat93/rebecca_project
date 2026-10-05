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

export const REBECCA_RAG_CHUNKS = [
  {
    id: 'profile-core',
    title: 'Rebecca — public profile',
    path: '/about',
    tags: ['about','profile','age','height','base','education','language','nationality','ethnicity','style','personality'],
    text: `Risqué Rebecca is a Singapore-based professional companion established since 2015. She is in her late 20s, 167 cm / 5'6", Chinese-Portuguese Singaporean, fluent in English and Mandarin, with a BBA and MA. She describes herself as witty, warm, candid, adventurous, intellectually curious, well-travelled and occasionally well-behaved. Her style is elegant, feminine and quiet-luxury leaning. She has visited 52 countries and has lived, studied and worked across three continents.`
  },
  {
    id: 'profile-interests',
    title: 'Rebecca — interests and tastes',
    path: '/about',
    tags: ['interests','food','wine','books','reading','fitness','travel','culture','f1','cars','fashion','hobbies','passions'],
    text: `Rebecca reads several books at once and enjoys fitness, travel, fermentation and culture, history, anthropology, economics, cooking, food and wine, F1 and cars, aesthetics and theatre. She is a retired student athlete and classically trained pianist. She loves tasting menus, sushi, steak, fresh seafood and thoughtful wine pairings. Favourite countries she has mentioned include Uzbekistan, Japan, Bolivia and the Czech Republic.`
  },
  {
    id: 'singapore-rates',
    title: 'Singapore rates',
    path: '/rates',
    tags: ['singapore','rates','rate','price','cost','consideration','sgd','hours','overnight','extensions'],
    text: `Singapore rates: 1.5h SGD 2,200; 2h SGD 2,400; 3h SGD 2,800; 4h SGD 3,200; 6h SGD 4,000; 8h SGD 5,000; 14–15h SGD 7,500; 18h SGD 8,500; 24h SGD 10,000; up to 48h SGD 14,000. 2.5 days and beyond is bespoke. In-date extensions are SGD 800/hour.`
  },
  {
    id: 'singapore-terms',
    title: 'Singapore booking details',
    path: '/rates',
    tags: ['couples','hosting','privacy','phone','call','extension','risque','experience','room service','activity'],
    text: `Dates of 3 hours or more should include lunch, dinner, drinks or an activity. For dates of 4 hours or longer that stay completely private, add SGD 500 and include room service. Singapore hosting starts from SGD 400 with a 1.5-hour minimum and is occasional. Couples have a 2-hour minimum and add SGD 800. Enhanced bespoke experiences typically begin from +SGD 1,000 above standard rates. A 20-minute phone call is SGD 250, requires screening, and the published page says this amount can be credited toward the booking. Rates are not negotiable.`
  },
  {
    id: 'fmty-general',
    title: 'Fly me to you — regional minimums',
    path: '/travel',
    tags: ['fmty','fly','travel','invite','asia','india','australia','europe','middle east','north america','flights'],
    text: `Fly-me-to-you minimums: selected Asia promotion is 14 hours plus travel for Hong Kong, Taipei, Macau, Bali, Bangkok, Kuala Lumpur, Maldives, Ho Chi Minh City, Hanoi and Manila. Rest of Asia plus India: 24 hours plus flights. Australia, New Zealand, Oceania, Europe and Middle East: 48 hours plus flights. North America: 72 hours plus flights. Business or first class is appreciated where possible.`
  },
  {
    id: 'tour-calendar',
    title: 'Upcoming public travel calendar',
    path: '/travel',
    tags: ['travel','calendar','tour','touring','dates','india','hong kong','london','europe','north america','september','november','december'],
    text: `Public touring calendar currently lists Hong Kong 23–27 September; India 10–30 November 2026 with Bangalore, Chennai, Delhi, Hyderabad, Kolkata and Mumbai; London and Europe 1–7 December 2026; and North America accepting expressions of interest for selected cities. Public dates are estimates for privacy and immigration safety. Exact timing and location are shared privately after screening and deposit.`
  },
  {
    id: 'tour-domestic-minimums',
    title: 'Tour-side FMTY minimums',
    path: '/travel',
    tags: ['travel','fmty','london','uk','europe','hong kong','china','japan','korea','usa','india','sri lanka','maldives','australia','oceania'],
    text: `Published tour-side minimums: from London to Greater UK or major European cities, 6h plus travel; from Hong Kong to China/Japan/Korea, 8h; domestic USA FMTY, 14h overnight; domestic China, 8h; domestic India, 14h overnight; India to Sri Lanka/Maldives, 14h overnight; domestic Australia, 8h; Australia to other parts of Oceania, 14h overnight.`
  },
  {
    id: 'india-rates',
    title: 'India touring rates',
    path: '/travel',
    tags: ['india','rates','rate','price','inr','usd','touring'],
    text: `India has a 2-hour minimum. 2h INR 190K / USD 2,100; 3h INR 230K / USD 2,500; 4h INR 260K / USD 2,800; 6h INR 350K / USD 3,800; 8h INR 400K / USD 4,800; 14–15h INR 600K / USD 6,500; 18h INR 700K / USD 7,600; 24h INR 800K / USD 8,700. Extensions +INR 60K/hour.`
  },
  {
    id: 'hong-kong-rates',
    title: 'Hong Kong touring rates',
    path: '/travel',
    tags: ['hong','kong','hk','rates','rate','price','hkd','touring'],
    text: `Hong Kong rates: 1h HKD 9,000; 1.5h HKD 11,500; 2h HKD 13,000; 3h HKD 16,000; 4h HKD 19,000; 6h HKD 24,000; 8h HKD 30,000; 14–15h HKD 45,000; 18h HKD 50,000; 24h HKD 60,000. Extensions +HKD 4,800/hour.`
  },
  {
    id: 'other-tour-rates',
    title: 'Other published touring rates',
    path: '/travel',
    tags: ['london','usa','america','australia','china','rates','gbp','usd','aud','rmb'],
    text: `London rates: 1h GBP 950; 1.5h 1,200; 2h 1,350; 3h 1,550; 4h 1,700; 6h 2,300; 8h 2,800; 14–15h 4,200; 18h 4,900; 24h 5,700; extensions +GBP 400/h. USA has a 2h minimum: 2h USD 2,400; 3h 3,000; 4h 3,500; 6h 4,500; 8h 5,500; 14–15h 7,500; 18h 9,000; 24h 12,000; extensions +USD 700/h. Australia: 1h AUD 1,400; 1.5h 1,800; 2h 2,200; 3h 2,600; 4h 3,000; 6h 4,000; 8h 5,000; 14–15h 7,500; 18h 8,500; 24h 9,500; extensions +AUD 800/h. China: 1h RMB 8,800; 1.5h 10,800; 2h 12,800; 3h 14,800; 4h 16,800; 6h 21,800; 8h 26,800; 14–15h 40,800; 18h 45,800; 24h 54,800; extensions +RMB 4,000/h. For unlisted countries, use Singapore rates converted to local currency and rounded up as a starting point.`
  },
  {
    id: 'screening',
    title: 'Screening and privacy',
    path: '/etiquette',
    tags: ['screening','screen','verify','verification','linkedin','id','employment','privacy','documents'],
    text: `Screening is required. Published routes include LinkedIn, ID and employment verification, among other options. Rebecca may ask for more information or decline. Screening information is private and deleted after verification. Sensitive screening documents must never be sent through the website concierge; use Rebecca’s verified private contact channels.`
  },
  {
    id: 'deposits-cancellations',
    title: 'Deposits and cancellations',
    path: '/etiquette',
    tags: ['deposit','deposits','cancel','cancellation','refund','reschedule','touring','hosting'],
    text: `All confirmed dates require deposits, including repeat meetings. Singapore: 20–25%; touring: 40%; fly-me-to-you: 50% plus travel. Deposit is requested within 24h after details are confirmed. With 48h+ notice, deposits can generally transfer to a future date after non-refundable costs. Touring, hosting and gift-card deposits are non-refundable. Last-minute cancellations carry a 100% fee. If a guest cuts a date short, the agreed rate still applies. If Rebecca cancels for ordinary reasons, the deposit is returned in full. Unsafe, pushy or disrespectful behaviour can end a booking without refund.`
  },
  {
    id: 'etiquette',
    title: 'Etiquette and boundaries',
    path: '/etiquette',
    tags: ['etiquette','manners','boundary','boundaries','privacy','selfie','face','off clock','negotiation','outfit'],
    text: `Rebecca’s rates are not negotiated. Boundaries must be respected immediately. Private conversations and personal information remain private. Rebecca does not meet off the clock, does not publicly show her face and does not provide extra private selfies on request. Outfit requests are acceptable; micromanagement is not. Mutual discretion applies if you happen to meet socially.`
  },
  {
    id: 'date-ideas-public',
    title: 'Public date ideas',
    path: '/date-ideas',
    tags: ['date','ideas','activity','activities','spa','movie','museum','theatre','karaoke','kart','arcade','beach','fitness','shopping'],
    text: `Rebecca enjoys dates with an activity and is comfortable in settings from casual bars to three-star Michelin restaurants. Public favourites include bar hopping, movies, couples spas, cultural performances, beach clubs, karaoke, go-karting, hawker-food adventures, museums, mini-golf, cooking/craft/wine workshops, escape rooms, Pilates/yoga/Barry’s-style fitness, sightseeing, shopping, arcades and theatre. She has a separate highly curated private list of frequented date spots for confirmed suitors; the concierge must not reveal or invent the locked list.`
  },
  {
    id: 'wishlist',
    title: 'Wishlist and gifts',
    path: '/date-ideas',
    tags: ['wishlist','gift','gifts','flowers','lingerie','wine','champagne','jewellery','watch','spa','food','throne'],
    text: `Gifts are never expected. Public favourites include Bordelle, Anoeses, Salute by Wacoal and Mariemur lingerie; light-coloured roses, peonies, hydrangeas and orchids; Lululemon underwear size M; Hermès 90×90 silk scarves/twillies; Aman, Mandarin Oriental, ClassPass and Sephora gift cards; wine, vintage champagne, whisky/scotch, sake, gin, mezcal or tequila; caviar, sea urchin, French unsalted butter and locally sourced premium ingredients; and 18K white or rose gold jewellery. Rebecca has a Throne wishlist and asks visitors to contact her for her gifting email.`
  },
  {
    id: 'food-drink',
    title: 'Food and drink favourites',
    path: '/date-ideas',
    tags: ['food','wine','champagne','whisky','tequila','fruit','restaurant','tasting','krug','bordeaux'],
    text: `Rebecca likes premium Japanese fruit, good wine and champagne, charcuterie and cheese, fine pastries and savoury food. Champagne houses she has named include Krug, Billecart-Salmon and Egly-Ouriet. Wine interests include Bordeaux, Montepulciano, Provence, Piedmont, Marlborough, Chinese wines from Shandong/Ningxia and natural orange wines. She takes whisky or tequila neat.`
  },
  {
    id: 'contact',
    title: 'Official contact and enquiries',
    path: '/contact',
    tags: ['contact','whatsapp','signal','imessage','telegram','email','enquiry','booking'],
    text: `Official channels: WhatsApp/iMessage/Signal +65 8528 2912; Telegram @forkmerebecca; Telegram channel https://tinyurl.com/rebecca-afterhours; email risquerebeccaxo@protonmail.com. Live availability and booking confirmation come directly from Rebecca. Complete enquiries should include preferred date/window, duration, location and a screening route.`
  },
  {
    id: 'faq-first-meeting',
    title: 'First meeting and expectations',
    path: '/about',
    tags: ['first','new','newbie','expect','expectation','impression','pda','real','scam'],
    text: `Rebecca welcomes respectful newcomers who can read and follow the booking instructions. She values thoughtful gestures, reliability, efficiency and consistency. She describes dates as natural, attentive and easy rather than performative. Her public FAQ jokes about Schrödinger’s date when asked whether she is real, while her long-running public reviews and established-since-2015 presence provide the practical reputation context.`
  }
];

function normalize(text='') {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
