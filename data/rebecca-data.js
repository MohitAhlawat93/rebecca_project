// Canonical public facts for Risqué Rebecca.
// Edit mutable profile/rate/travel/policy/contact facts here first.
// Website renderers and the AI concierge consume this same module.

export const REBECCA_DATA = {
  meta: {
    dataVersion: '2026-10-05.7B',
    lastVerified: '2026-10-05',
    originalPublicSite: 'https://www.risquerebecca.com/',
    reviewDomain: 'https://rebeccaproject.vercel.app'
  },

  profile: {
    displayName: 'Risqué Rebecca',
    establishedSince: 2015,
    base: 'Singapore',
    secondaryBase: 'sometimes Hong Kong',
    age: 'Late 20s',
    height: { metric: '167 cm', imperial: '5’6”' },
    heritage: 'Chinese-Portuguese Singaporean',
    languages: ['English', 'Mandarin'],
    education: ['BBA', 'MA'],
    countriesVisited: 52,
    continentsLivedStudiedWorked: 3,
    style: ['Elegant', 'feminine', 'quiet luxury'],
    interests: ['Books', 'travel', 'food', 'wine', 'culture', 'history', 'F1'],
    extendedInterests: ['fitness', 'fermentation', 'anthropology', 'economics', 'cooking', 'cars', 'aesthetics', 'theatre'],
    values: ['Freedom', 'balance', 'openness', 'curiosity'],
    weaknesses: ['Heels', 'tasting menus', 'good wine'],
    descriptors: ['witty', 'warm', 'candid', 'adventurous', 'intellectually curious', 'well-travelled'],
    publicDetails: {
      dressSize: 'US 6–8',
      shoeSize: 'EU 40',
      braSize: '32D',
      sexuality: 'bisexual',
      dynamic: 'switchy',
      smoking: 'non-smoker',
      drinking: 'moderate drinker',
      background: ['retired student athlete', 'classically trained pianist']
    },
    favouriteCountriesMentioned: ['Uzbekistan', 'Japan', 'Bolivia', 'Czech Republic'],
    homeFacts: [
      { label: 'Base', value: 'Singapore · sometimes Hong Kong · frequently invited elsewhere' },
      { label: 'Age', value: 'Late 20s' },
      { label: 'Height', value: '167 cm · 5’6”' },
      { label: 'Heritage', value: 'Chinese-Portuguese Singaporean' },
      { label: 'Languages', value: 'English · Mandarin' },
      { label: 'Education', value: 'BBA + MA' },
      { label: 'Style', value: 'Elegant · feminine · quiet luxury' },
      { label: 'Talk to me about', value: 'Books · travel · food · wine · culture · history · F1' }
    ],
    aboutFacts: [
      { label: 'Base', value: 'Singapore · sometimes Hong Kong' },
      { label: 'Age', value: 'Late 20s' },
      { label: 'Height', value: '167 cm · 5’6”' },
      { label: 'Heritage', value: 'Chinese-Portuguese Singaporean' },
      { label: 'Languages', value: 'English · Mandarin' },
      { label: 'Education', value: 'BBA + MA' },
      { label: 'Style', value: 'Elegant · feminine · quiet luxury' },
      { label: 'Weaknesses', value: 'Heels · tasting menus · good wine' },
      { label: 'Values', value: 'Freedom · balance · openness · curiosity' }
    ],
    philosophy: {
      label: 'Pragmatic romantic',
      title: 'Luxury is ease, not theatre.',
      body: 'Beautiful places are lovely, but the real luxury is enough time and ease to stop performing. Rebecca prefers dates that can wander naturally through good food, flirty banter, terrible jokes, unexpected tangents and the feeling that neither person is watching the clock.'
    },
    interview: [
      {
        question: 'How do I make a good first impression?',
        answer: 'Be efficient, reliable and capable of reading the practical details. Thoughtful gestures are lovely; making plans easy is genuinely attractive.'
      },
      {
        question: 'What should a date with you feel like?',
        answer: 'Natural, present and unhurried. Good food helps, but so do private jokes, a little spontaneity and enough time for the conversation to go somewhere neither of us planned.'
      },
      {
        question: 'What makes you happy?',
        answer: 'Balance: enough security to make choices freely, and enough freedom to follow curiosity without making decisions from fear.'
      },
      {
        question: 'Strengths and weaknesses?',
        answer: 'I am extremely present when I am with someone, adaptable and comfortable in my own skin. I am also very honest, occasionally to my own detriment, and spectacularly indecisive when a menu gives me too many good options.'
      },
      {
        question: 'What are your pet peeves?',
        answer: 'Bad manners, bad wine and wilful intellectual laziness. Rate negotiation deserves an honourable mention.'
      },
      {
        question: 'What can we talk about?',
        answer: 'Books, food, wine, travel, people and places, history, psychology, economics, fitness, theatre, F1, cars and whatever niche obsession has claimed the week.'
      },
      {
        question: 'Are you really this opinionated in person?',
        answer: 'Probably worse.'
      }
    ]
  },

  singapore: {
    currency: 'SGD',
    rates: [
      { label: '1.5 hours', short: '1.5h', amount: 2200, category: 'An initiation', note: 'Icebreaker' },
      { label: '2 hours', short: '2h', amount: 2400, category: 'An initiation', note: 'Delight' },
      { label: '3 hours', short: '3h', amount: 2800, category: 'Most requested', note: 'Cocktails & charm', featured: true },
      { label: '4 hours', short: '4h', amount: 3200, category: 'A keen exploration', note: 'Dinner & drinks' },
      { label: '6 hours', short: '6h', amount: 4000, category: 'A keen exploration', note: 'Dinner, drinks, dessert' },
      { label: '8 hours', short: '8h', amount: 5000, category: 'A keen exploration', note: 'A day off' },
      { label: '14–15 hours', short: '14–15h', amount: 7500, category: 'The bold plunge', note: 'Overnight' },
      { label: '18 hours', short: '18h', amount: 8500, category: 'The bold plunge', note: 'Overnight & brunch' },
      { label: '24 hours', short: '24h', amount: 10000, category: 'The bold plunge', note: 'All-day affair', featured: true },
      { label: 'Up to 48 hours', short: 'Up to 48h', amount: 14000, category: 'The odyssey', note: 'Cheeky getaway' },
      { label: '2.5 days +', short: '2.5 days +', amount: null, display: 'Bespoke', category: 'The odyssey', note: 'Reach out to discuss.' }
    ],
    extensionPerHour: 800,
    terms: {
      threeHoursPlus: 'Three hours or more should include lunch, dinner, drinks or an activity.',
      longPrivate: { minHours: 4, surcharge: 500, roomService: true },
      hosting: {
        from: 400,
        minHours: 1.5,
        frequency: 'up to three times a year',
        eligibility: 'subscribers and people Rebecca has met before'
      },
      couples: { minHours: 2, surcharge: 500 },
      phoneCall: { minutes: 20, fee: 250, screeningRequired: true, creditTowardBooking: false },
      bespokeAdditionsFrom: 1000,
      ratesFixed: true
    }
  },

  travel: {
    calendar: [
      {
        id: 'india-nov-2026',
        kicker: 'India · 10–30 November',
        dateRange: '10–30 November 2026',
        title: 'Six cities, plus domestic FMTY.',
        cities: ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai'],
        body: 'Bangalore · Chennai · Delhi · Hyderabad · Kolkata · Mumbai. Domestic invitations to other Indian cities start from a 14-hour overnight.',
        meta: ['2h minimum for standard India dates', 'Exact dates shared privately']
      },
      {
        id: 'london-europe-dec-2026',
        kicker: 'London & Europe · 1–7 December',
        dateRange: '1–7 December 2026',
        title: 'London first. Europe by invitation.',
        body: 'From London, invitations to Greater UK and major European cities begin from 6 hours plus travel.',
        meta: ['Early enquiries encouraged', 'Screening + deposit'],
        alt: true
      }
    ],
    northAmericaNotice: 'North America: currently accepting expressions of interest for selected cities. Public dates are always approximate; exact details are shared after screening and deposit.',
    fmty: [
      {
        id: 'selected-asia',
        label: 'Selected Asia destinations',
        minimum: '18 hours + travel',
        destinations: ['Hong Kong', 'Taipei', 'Macau', 'Bali', 'Bangkok', 'Kuala Lumpur', 'Maldives', 'Ho Chi Minh City', 'Hanoi', 'Manila']
      },
      { id: 'rest-asia-india', label: 'Rest of Asia + India', minimum: '24 hours + flights' },
      { id: 'oceania-europe-middle-east', label: 'Australia · NZ · Oceania · Europe · Middle East', minimum: '48 hours + flights' },
      { id: 'north-america', label: 'North America', minimum: '72 hours + flights' },
      { id: 'africa-south-central-america', label: 'Africa · South America · Central America', minimum: '1 week + flights' }
    ],
    comfort: 'Business or first class appreciated',
    publicDatesNote: 'Estimates for privacy & immigration safety',
    tourSideMinimums: {
      londonToUkEurope: '6h + travel',
      hongKongToChinaJapanKorea: '8h',
      domesticUsa: '14h overnight',
      domesticChina: '8h',
      domesticIndia: '14h overnight',
      indiaToSriLankaMaldives: '14h overnight',
      domesticAustralia: '8h',
      australiaToOceania: '14h overnight'
    },
    touringRates: {
      India: {
        minimum: '2h minimum',
        items: [
          ['2h', 'INR 190K / USD 2,100'], ['3h', 'INR 230K / USD 2,500'], ['4h', 'INR 260K / USD 2,800'],
          ['6h', 'INR 350K / USD 3,800'], ['8h', 'INR 400K / USD 4,800'], ['14–15h', 'INR 600K / USD 6,500'],
          ['18h', 'INR 700K / USD 7,600'], ['24h', 'INR 800K / USD 8,700']
        ],
        extension: '+INR 60K/h'
      },
      'Hong Kong': {
        items: [
          ['1h', 'HKD 9,000'], ['1.5h', 'HKD 11,500'], ['2h', 'HKD 13,000'], ['3h', 'HKD 16,000'],
          ['4h', 'HKD 19,000'], ['6h', 'HKD 24,000'], ['8h', 'HKD 30,000'], ['14–15h', 'HKD 45,000'],
          ['18h', 'HKD 50,000'], ['24h', 'HKD 60,000']
        ],
        extension: '+HKD 4,800/h'
      },
      London: {
        items: [
          ['1h', 'GBP 950'], ['1.5h', 'GBP 1,200'], ['2h', 'GBP 1,350'], ['3h', 'GBP 1,550'],
          ['4h', 'GBP 1,700'], ['6h', 'GBP 2,300'], ['8h', 'GBP 2,800'], ['14–15h', 'GBP 4,200'],
          ['18h', 'GBP 4,900'], ['24h', 'GBP 5,700']
        ],
        extension: '+GBP 400/h'
      },
      USA: {
        minimum: '2h minimum',
        items: [
          ['2h', 'USD 2,400'], ['3h', 'USD 3,000'], ['4h', 'USD 3,500'], ['6h', 'USD 4,500'],
          ['8h', 'USD 5,500'], ['14–15h', 'USD 7,500'], ['18h', 'USD 9,000'], ['24h', 'USD 12,000']
        ],
        extension: '+USD 700/h'
      },
      Australia: {
        items: [
          ['1h', 'AUD 1,400'], ['1.5h', 'AUD 1,800'], ['2h', 'AUD 2,200'], ['3h', 'AUD 2,600'],
          ['4h', 'AUD 3,000'], ['6h', 'AUD 4,000'], ['8h', 'AUD 5,000'], ['14–15h', 'AUD 7,500'],
          ['18h', 'AUD 8,500'], ['24h', 'AUD 9,500']
        ],
        extension: '+AUD 800/h'
      },
      China: {
        items: [
          ['1h', 'RMB 8,800'], ['1.5h', 'RMB 10,800'], ['2h', 'RMB 12,800'], ['3h', 'RMB 14,800'],
          ['4h', 'RMB 16,800'], ['6h', 'RMB 21,800'], ['8h', 'RMB 26,800'], ['14–15h', 'RMB 40,800'],
          ['18h', 'RMB 45,800'], ['24h', 'RMB 54,800']
        ],
        extension: '+RMB 4,000/h'
      }
    },
    practicalities: [
      'Tour dates shown publicly are estimates. Once screening is complete and a deposit is in place, I’ll share exact timing and location privately.',
      'When touring, I host only in impeccable four- or five-star hotels. If you want to see me somewhere that is not listed, send the city and proposed dates anyway; I am very open to making a good invitation work.',
      'For unlisted countries, use my Singapore rates converted into local currency and rounded up as a starting point.'
    ]
  },

  policies: {
    screening: {
      required: true,
      routes: ['LinkedIn / professional profile', 'ID privately through verified channel', 'Employment verification privately', 'Returning guest / known reference', 'Would like to discuss options'],
      paragraphs: [
        'Screening is required. Accepted routes include LinkedIn, ID and employment verification, among other options. If I need more information, I will ask; if I am not comfortable, I may decline.',
        'Screening information is for my eyes only and is deleted after verification. If you prefer, sensitive material can be sent as a disappearing message through my verified WhatsApp or Telegram.'
      ],
      conciergeNotice: 'Please do not send ID, employer documents or other sensitive screening material to the concierge here.'
    },
    deposits: [
      { label: 'Singapore', value: '20–25% minimum' },
      { label: 'Touring', value: '40% minimum' },
      { label: 'Fly me to you', value: '50% + travel expenses' }
    ],
    depositTiming: 'within 24 hours after details are agreed',
    cancellations: [
      { title: '48+ hours’ notice', body: 'A deposit can usually be transferred to a future date after non-refundable costs are deducted.' },
      { title: 'Touring / hosting / gift-card deposits', body: 'These are non-refundable because costs may already have been incurred.' },
      { title: 'Last-minute cancellation', body: 'A last-minute cancellation carries a 100% cancellation fee. If you cut a confirmed date short, the originally agreed rate still applies.' },
      { title: 'If I have to cancel', body: 'If I cancel for ordinary reasons, your deposit is returned in full. Unsafe, pushy or disrespectful behaviour is a separate matter and ends the booking immediately.' },
      { title: 'When should I contact you?', body: 'When you are ready to complete screening and send the required deposit within 24 hours after details are agreed.' }
    ],
    boundaries: [
      'My rates are not negotiated. A boundary should never need to be stated twice. Private conversations, contact information and anything shared in confidence stay between us.',
      'I do not meet “off the clock.” I do not publicly show my face and I do not send extra private selfies on request. Outfit requests are welcome; micromanagement is not.',
      'If we ever cross paths socially, treat me exactly as I would treat you: like a stranger who happened to make eye contact.'
    ]
  },

  dateIdeas: {
    public: ['bar hopping', 'movies', 'couples spas', 'cultural performances', 'beach clubs', 'karaoke', 'go-karting', 'hawker-food adventures', 'museums', 'mini-golf', 'cooking/craft/wine workshops', 'escape rooms', 'Pilates/yoga/Barry’s-style fitness', 'sightseeing', 'shopping', 'arcades', 'theatre'],
    categories: [
      {
        label: 'Eat',
        title: 'Make dinner the beginning.',
        body: 'Tasting menus, sushi, steak, fresh seafood, thoughtful pairings, hidden bars and the sort of lunch that accidentally becomes dinner.',
        notes: ['Tasting menus', 'Wine flights', 'Hidden bars', 'Cooking classes']
      },
      {
        label: 'Play',
        title: 'A little competition helps.',
        body: 'Go-karts, arcades, karaoke, mini-golf, escape rooms and anything that gives us something to laugh about afterwards.',
        notes: ['Go-karts', 'Arcades', 'Karaoke', 'Escape rooms']
      },
      {
        label: 'Disappear',
        title: 'Turn the volume down.',
        body: 'Couples spas, beach clubs, a beautiful hotel, a quiet drink or an afternoon with absolutely nowhere else to be.',
        notes: ['Couples spas', 'Beach clubs', 'Slow afternoons', 'Beautiful hotels']
      },
      {
        label: 'Look',
        title: 'Give curiosity somewhere to go.',
        body: 'Museums, theatre, opera, cultural performances, city wandering and exhibitions worth discussing over a drink afterwards.',
        notes: ['Museums', 'Theatre', 'Opera', 'Exhibitions']
      },
      {
        label: 'Move',
        title: 'Not every date needs a tablecloth.',
        body: 'Pilates, yoga, boxing, padel, golf, sightseeing or a class where enthusiasm matters more than being particularly good at it.',
        notes: ['Pilates', 'Yoga', 'Padel', 'Classes']
      }
    ],
    privateListIsLocked: true
  },

  wishlist: {
    lingerie: ['Bordelle', 'Anoeses', 'Salute by Wacoal', 'Mariemur'],
    flowers: ['light-coloured roses', 'peonies', 'hydrangeas', 'orchids'],
    fashion: ['Lululemon underwear size M', 'Hermès 90×90 silk scarves/twillies'],
    giftCards: ['Aman', 'Mandarin Oriental', 'ClassPass', 'Sephora'],
    drinks: ['wine', 'vintage champagne', 'whisky/scotch', 'sake', 'gin', 'mezcal', 'tequila'],
    food: ['caviar', 'sea urchin', 'French unsalted butter', 'locally sourced premium ingredients'],
    jewellery: '18K white or rose gold jewellery',
    champagneHouses: ['Krug', 'Billecart-Salmon', 'Egly-Ouriet'],
    wineInterests: ['Bordeaux', 'Montepulciano', 'Provence', 'Piedmont', 'Marlborough', 'Shandong/Ningxia', 'natural orange wines'],
    categories: [
      { label: 'Flowers', title: 'Big bouquets, soft colours.', body: 'Light-coloured roses, peonies, hydrangeas and orchids.' },
      { label: 'Bottles', title: 'Something worth opening together.', body: 'Krug, Billecart-Salmon, Egly-Ouriet, interesting wine, whisky, sake, gin, mezcal or tequila.' },
      { label: 'Table', title: 'Edible souvenirs.', body: 'Caviar, sea urchin, excellent butter, premium seasonal fruit and thoughtfully sourced ingredients from somewhere specific.' },
      { label: 'Wear', title: 'Beautiful details.', body: 'Bordelle, Anoeses, Salute by Wacoal, silk scarves and 18K white or rose gold jewellery.' },
      { label: 'Experience', title: 'Memories beat clutter.', body: 'Spa time, a class together, a beautiful meal or something that gives us another story to tell.' }
    ]
  },

  reputation: {
    establishedSince: 2015,
    themes: ['reliable', 'professional', 'engaging', 'intellectual', 'energetic', 'genuine', 'magnetic', 'better in person than photographs suggest'],
    proofPoints: [
      { label: 'Established', value: '2015', note: 'A long public track record, not a newly assembled profile.' },
      { label: 'Public review span', value: '2018–2026', note: 'Feedback visible across multiple years and independent platforms.' },
      { label: 'Review sources', value: 'Ivy Societe · TER · Scarlet Blue', note: 'Named sources rather than anonymous website-only endorsements.' },
      { label: 'Public photography', value: '111 photographs', note: 'A substantial professional and candid archive, intentionally photo-only.' }
    ],
    reviews: [
      { excerpt: 'Stunning in person, great communicator, reliable service, fun attitude, effortlessly professional.', source: 'Ivy Societe', date: 'June 2026', year: 2026 },
      { excerpt: 'Classy, intellectual, engaging, energetic.', source: 'TER', date: 'November 2025', year: 2025 },
      { excerpt: 'The full package and more.', source: 'Ivy Societe', date: 'March 2025', year: 2025 },
      { excerpt: 'Genuine and magnetic.', source: 'Scarlet Blue', date: 'December 2024', year: 2024 },
      { excerpt: 'Sweet, quirky, funny and genuine.', source: 'Scarlet Blue', date: 'December 2021', year: 2021 },
      { excerpt: 'Anything shorter than a dinner date is limiting her magic.', source: 'Scarlet Blue', date: 'December 2018', year: 2018 }
    ]
  },

  gallery: {
    professionalCount: 67,
    candidCount: 44,
    totalCount: 111,
    photoOnly: true,
    professionalPath: '/professional',
    candidPath: '/selfies-of-risquerebecca'
  },

  contact: {
    phoneDisplay: '+65 8528 2912',
    whatsappUrl: 'https://wa.me/6585282912',
    telegramHandle: '@forkmerebecca',
    telegramUrl: 'https://t.me/forkmerebecca',
    email: 'risquerebeccaxo@protonmail.com',
    telegramChannelLabel: 'Rebecca Afterhours',
    telegramChannelUrl: 'https://tinyurl.com/rebecca-afterhours',
    liveAvailabilityOwner: 'Rebecca'
  }
};

export function formatSgd(amount) {
  return amount == null ? 'Bespoke' : `SGD ${Number(amount).toLocaleString('en-US')}`;
}

export function formatSingaporeRatesCompact() {
  const rates = REBECCA_DATA.singapore.rates
    .filter((rate) => rate.amount != null)
    .map((rate) => `${rate.short} ${formatSgd(rate.amount).replace('SGD ', '')}`)
    .join('; ');
  return `Singapore: ${rates}. Longer dates are bespoke; extensions are SGD ${REBECCA_DATA.singapore.extensionPerHour.toLocaleString('en-US')}/hour.`;
}

export function formatTouringRates(name) {
  const set = REBECCA_DATA.travel.touringRates[name];
  if (!set) return '';
  const prefix = set.minimum ? `${set.minimum}. ` : '';
  const items = set.items.map(([duration, price]) => `${duration} ${price}`).join('; ');
  return `${prefix}${items}. Extensions: ${set.extension}.`;
}

export function formatFmtySummary() {
  return REBECCA_DATA.travel.fmty.map((item) => `${item.label}: ${item.minimum}`).join('; ') + '.';
}

export function formatCalendarSummary() {
  const windows = REBECCA_DATA.travel.calendar.map((item) => `${item.kicker.replace(' · ', ' ')} (${item.body})`).join(' Then ');
  return `Upcoming public windows: ${windows} ${REBECCA_DATA.travel.northAmericaNotice}`;
}

export function formatDepositSummary() {
  return REBECCA_DATA.policies.deposits.map((item) => `${item.label} ${item.value}`).join('; ') + `.`;
}
