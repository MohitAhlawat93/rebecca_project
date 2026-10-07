export const GEO_AUTHORITY = {
  schemaVersion: 1,
  id: 'singapore-authority',
  country: {
    name: 'Singapore',
    code: 'SG',
    slug: 'singapore',
    path: '/singapore',
    title: 'Rebecca’s Singapore — Neighbourhoods, Date Ideas & City Notes',
    description: 'Explore Rebecca’s public Singapore guide to Marina Bay, Orchard Road and Sentosa, shaped around food, culture, design, slower afternoons and practical city planning.',
    eyebrow: 'Rebecca’s Singapore',
    heading: 'Three neighbourhoods. Three very different moods.',
    intro: 'Singapore is home base, but one version of the city would be a poor description of it. This small edit starts with three neighbourhoods that suit very different kinds of days: skyline and culture, design and shopping, or a slower island escape.',
    perspective: [
      'Rebecca’s public interests make the useful filter fairly simple: good food, wine, museums, design, beautiful hotels, city wandering and enough time for a plan to become something less scripted.',
      'These pages are editorial neighbourhood notes, not a directory and not a list of paid venue endorsements. Opening hours, reservations and venue policies can change, so current logistics should always be checked with the venue itself.'
    ],
    source: {
      label: 'Visit Singapore — official tourism site',
      url: 'https://www.visitsingapore.com/'
    },
    lastFactCheck: '2026-10-07'
  },
  launchLimit: 3,
  minimumEditorialCharacters: 900,
  maximumPairwiseSimilarity: 0.58,
  hubs: [
    {
      id: 'marina-bay',
      slug: 'marina-bay',
      name: 'Marina Bay',
      shortLabel: 'Skyline · culture · dinner',
      title: 'Marina Bay with Rebecca — Skyline, Culture & Evening Ideas',
      description: 'An editorial Marina Bay guide shaped around Rebecca’s public interests in food, wine, culture, architecture and city wandering, with practical planning notes.',
      hero: 'A polished city evening with enough architecture and culture to stop it feeling generic.',
      placeType: 'Neighbourhood',
      source: {
        label: 'Visit Singapore — Marina Bay',
        url: 'https://www.visitsingapore.com/neighbourhood/featured-neighbourhood/marina-bay/'
      },
      facts: [
        'Marina Bay is one of Singapore’s signature waterfront districts, known for its skyline, contemporary architecture and major visitor attractions.',
        'The area brings museums, waterfront walking, dining, shopping and city views into a compact central district.',
        'ArtScience Museum and the Marina Bay waterfront make it easy to combine an indoor cultural stop with an outdoor evening.'
      ],
      sections: [
        {
          heading: 'Why this part of Singapore works',
          body: 'Marina Bay is useful when you want the evening to feel unmistakably Singapore without spending the entire time in transit. Architecture, exhibitions, waterfront views and dinner can sit in one sequence, which leaves more room for conversation and less room for logistics.'
        },
        {
          heading: 'A good rhythm',
          body: 'Start indoors while the afternoon is still hot, move toward the waterfront as the light softens, then let dinner or drinks take over rather than forcing a long checklist of attractions. The district works best when the skyline is part of the background, not the entire plan.'
        },
        {
          heading: 'Why it matches Rebecca’s public tastes',
          body: 'Museums, tasting menus, thoughtful wine, city wandering and visually interesting spaces already appear across Rebecca’s public favourites. Marina Bay naturally combines several of those interests without needing a complicated itinerary.'
        },
        {
          heading: 'Practical planning note',
          body: 'Singapore heat and sudden rain make an indoor-to-outdoor sequence more comfortable than an all-evening walk. Pick one clear meeting point, leave buffer around reservations and check current venue hours directly before the date.'
        }
      ],
      goodFor: ['Architecture & skyline', 'Museums & exhibitions', 'Dinner & drinks', 'A polished first evening'],
      related: ['orchard-road', 'sentosa']
    },
    {
      id: 'orchard-road',
      slug: 'orchard-road',
      name: 'Orchard Road',
      shortLabel: 'Design · shopping · wellness',
      title: 'Orchard Road with Rebecca — Design, Shopping & Slow City Time',
      description: 'A thoughtful Orchard Road guide for design, shopping, wellness and dinner, shaped around Rebecca’s public interests rather than a generic list of malls.',
      hero: 'Best when the plan needs flexibility: browse, pause, change direction, then stay for dinner.',
      placeType: 'Neighbourhood',
      source: {
        label: 'Visit Singapore — Orchard Road',
        url: 'https://www.visitsingapore.com/neighbourhood/featured-neighbourhood/orchard-road/'
      },
      facts: [
        'Orchard Road stretches through several distinct pockets including Tanglin, Orchard, Somerset and Dhoby Ghaut.',
        'The district mixes major retail, local design, dining, wellness and cultural spaces rather than functioning as a single shopping centre.',
        'Tanglin is highlighted by Singapore’s tourism board for art, wellness, lifestyle and a more relaxed luxury atmosphere.'
      ],
      sections: [
        {
          heading: 'Why this part of Singapore works',
          body: 'Orchard is useful when you do not want the day locked to one reservation. It is easy to browse, stop for coffee, look at design or fashion, add a wellness break and only then decide how dressed-up dinner needs to be.'
        },
        {
          heading: 'A good rhythm',
          body: 'Treat Orchard as a sequence of pockets rather than one endless shopping street. A slower start around Tanglin can move toward Orchard or Somerset later, giving the day a natural change of energy without requiring a cross-city transfer.'
        },
        {
          heading: 'Why it matches Rebecca’s public tastes',
          body: 'Rebecca’s public favourites include fashion, silk, beauty, food, wine and experiences over clutter. Orchard works better through that lens when the focus is on design, interesting finds and time together rather than accumulating shopping bags.'
        },
        {
          heading: 'Practical planning note',
          body: 'Large malls make Orchard one of the easiest weather-proof options in Singapore, but the district covers more ground than it appears to on a map. Choose the part of Orchard first, then choose the venues; otherwise a simple plan can turn into unnecessary walking.'
        }
      ],
      goodFor: ['Design & local brands', 'Shopping with a point of view', 'Wellness', 'Flexible dinner plans'],
      related: ['marina-bay', 'sentosa']
    },
    {
      id: 'sentosa',
      slug: 'sentosa',
      name: 'Sentosa',
      shortLabel: 'Coast · spa · slower pace',
      title: 'Sentosa with Rebecca — Coast, Resorts & a Slower Singapore Day',
      description: 'An editorial Sentosa guide for a slower Singapore day with coast, wellness, resort dining and activities, shaped around Rebecca’s public date preferences.',
      hero: 'The choice when the point is to leave the city rhythm behind without leaving Singapore.',
      placeType: 'Island',
      source: {
        label: 'Visit Singapore — Sentosa Island',
        url: 'https://www.visitsingapore.com/neighbourhood/featured-neighbourhood/sentosa-island/'
      },
      facts: [
        'Sentosa is Singapore’s resort island, with beaches, coastal paths, attractions, resorts and ocean-view dining.',
        'The island supports both active plans and slower ones, from cycling and attractions to beach time, wellness and dinner.',
        'Siloso, Palawan and Tanjong offer different beach atmospheres, so choosing one part of the island helps keep the day coherent.'
      ],
      sections: [
        {
          heading: 'Why this part of Singapore works',
          body: 'Sentosa earns its place in the guide because it changes the pace. The island can hold a long lunch, spa time, a walk by the water, something playful and dinner without the day feeling like a sequence of city appointments.'
        },
        {
          heading: 'A good rhythm',
          body: 'Choose whether the day is primarily slow or active before choosing venues. A relaxed version might begin later, leave space for the coast or spa time and build toward sunset and dinner. A playful version can add one activity without turning the entire day into an attraction checklist.'
        },
        {
          heading: 'Why it matches Rebecca’s public tastes',
          body: 'Couples spas, beach clubs, beautiful hotels, movement and unhurried afternoons are already part of Rebecca’s public date preferences. Sentosa lets those ideas sit together more naturally than they would in the middle of the city.'
        },
        {
          heading: 'Practical planning note',
          body: 'Sentosa is compact but still works best when the plan stays within one or two zones. Build in island travel time, check whether reservations include access requirements, and avoid scheduling every hour if the reason for choosing Sentosa is a slower pace.'
        }
      ],
      goodFor: ['Long lunches', 'Spa & wellness', 'Coastal time', 'A slower day together'],
      related: ['marina-bay', 'orchard-road']
    }
  ]
};

export const GEO_PAGES = [
  {
    id: 'geo-singapore',
    path: '/singapore',
    file: 'singapore/index.html',
    localized: false,
    priority: 0.9,
    contentType: 'geo-hub'
  },
  ...GEO_AUTHORITY.hubs.map((hub) => ({
    id: 'geo-singapore-' + hub.id,
    path: '/singapore/' + hub.slug,
    file: 'singapore/' + hub.slug + '.html',
    localized: false,
    priority: 0.8,
    contentType: 'geo-micro-hub'
  }))
];
