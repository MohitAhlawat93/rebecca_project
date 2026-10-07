import { REBECCA_DATA } from '../data/rebecca-data.js';

const travel = REBECCA_DATA.travel;

export const TRAVEL_AUTHORITY = {
  schemaVersion: 1,
  id: 'rebecca-global-travel',
  asOf: REBECCA_DATA.meta.lastVerified,
  rootPath: '/travel',
  launchLimit: 3,
  prohibitDatedSlugs: true,
  source: {
    label: 'Rebecca’s original public touring page',
    url: 'https://www.risquerebecca.com/touring-rates'
  },
  principles: [
    'Destination URLs are permanent. Public trip dates update inside the destination page rather than creating a new seasonal URL.',
    'A destination page must be backed by Rebecca’s canonical public travel data: published rates, a current/known public tour, or explicit regional travel rules.',
    'City-level pages are not created merely because a city appears in a multi-city itinerary. A city needs enough distinct long-term value to justify its own page.'
  ],
  markets: [
    {
      id: 'london',
      slug: 'london',
      name: 'London',
      placeType: 'City',
      country: 'United Kingdom',
      countryCode: 'GB',
      rateKey: 'London',
      calendarIds: ['london-europe-dec-2026'],
      sideTripKeys: ['londonToUkEurope'],
      sideTripLabels: { londonToUkEurope: 'From London → Greater UK / major European cities' },
      title: 'Rebecca in London — Touring Dates, Rates & Travel Guidance',
      description: 'Rebecca’s permanent London travel page with current public touring dates when announced, published London rates, nearby invitation minimums and practical travel guidance.',
      eyebrow: 'London · permanent travel hub',
      hero: 'London gets a permanent home here, so the useful page survives long after any one December visit is over.',
      intro: 'Public dates can move, disappear or return in another year. This page keeps the stable London information in one place: the current public window when one exists, Rebecca’s published London rate set and the invitation rule for Greater UK and major European side trips.',
      editorial: [
        {
          heading: 'Why this URL stays',
          body: 'A dated page would throw away history every time a tour ends. London is a recurring enough public touring market to deserve one durable page that can be updated rather than replaced.'
        },
        {
          heading: 'How to use the page',
          body: 'If a public London window is shown, use it as an approximate planning signal rather than an exact location schedule. If no future window is shown, a thoughtful invitation with city, dates and duration is still more useful than waiting for a new page to appear.'
        }
      ]
    },
    {
      id: 'hong-kong',
      slug: 'hong-kong',
      name: 'Hong Kong',
      placeType: 'City',
      country: 'Hong Kong',
      countryCode: 'HK',
      rateKey: 'Hong Kong',
      calendarIds: [],
      sideTripKeys: ['hongKongToChinaJapanKorea'],
      sideTripLabels: { hongKongToChinaJapanKorea: 'From Hong Kong → China / Japan / Korea' },
      title: 'Rebecca in Hong Kong — Rates, Regional Travel & Future Visits',
      description: 'Rebecca’s permanent Hong Kong travel page with published Hong Kong rates, regional side-trip guidance and a stable place for future public visit updates.',
      eyebrow: 'Hong Kong · permanent travel hub',
      hero: 'A published touring market should not vanish from search simply because the latest public dates have passed.',
      intro: 'Hong Kong already has its own published rate set and is also a practical base for invitations onward to China, Japan and Korea. The permanent page remains useful between public visits and becomes the place where future dates can be added without creating another URL.',
      editorial: [
        {
          heading: 'Between public visits',
          body: 'No future date needs to be invented to keep this page useful. Published Hong Kong rates and regional invitation rules are stable information; the calendar block can simply say that no future public window is currently stored.'
        },
        {
          heading: 'Regional usefulness',
          body: 'Hong Kong is not being used as a doorway page for several countries. The value here is the specific public side-trip rule already associated with Hong Kong, while separate destination pages should only be created later if Rebecca develops enough real content or recurring demand for them.'
        }
      ]
    },
    {
      id: 'india',
      slug: 'india',
      name: 'India',
      placeType: 'Country',
      country: 'India',
      countryCode: 'IN',
      rateKey: 'India',
      calendarIds: ['india-nov-2026'],
      sideTripKeys: ['domesticIndia', 'indiaToSriLankaMaldives'],
      sideTripLabels: {
        domesticIndia: 'Domestic India invitations',
        indiaToSriLankaMaldives: 'From India → Sri Lanka / Maldives'
      },
      title: 'Rebecca in India — Touring Cities, Rates & Invitation Guidance',
      description: 'Rebecca’s permanent India travel hub with the current public multi-city tour when announced, India rates, domestic invitation minimums and nearby travel guidance.',
      eyebrow: 'India · permanent travel hub',
      hero: 'One strong India page is more useful than cloning the same offer across six thin city pages.',
      intro: 'Rebecca’s current public India plan spans multiple cities under one rate set and one domestic travel rule. That makes India the correct durable entity today. Individual city pages can be added later only if a city develops enough unique, repeated content to justify its own authority.',
      editorial: [
        {
          heading: 'Why one India hub',
          body: 'Bangalore, Chennai, Delhi, Hyderabad, Kolkata and Mumbai currently sit inside one public India tour rather than six different long-term products. Keeping them together avoids doorway-style city pages and lets the strongest page accumulate history across future India visits.'
        },
        {
          heading: 'Domestic invitations',
          body: 'The canonical public rules already explain how invitations to other Indian cities work. This page keeps that operational information close to the tour calendar instead of scattering it across duplicated city landing pages.'
        }
      ]
    }
  ]
};

export const TRAVEL_PAGES = TRAVEL_AUTHORITY.markets.map((market) => ({
  id: 'travel-' + market.id,
  path: TRAVEL_AUTHORITY.rootPath + '/' + market.slug,
  file: 'travel/' + market.slug + '.html',
  localized: false,
  priority: 0.8,
  contentType: 'travel-authority',
  generated: true
}));

export function travelEvidenceFor(market) {
  return {
    rateSet: travel.touringRates[market.rateKey] || null,
    calendar: market.calendarIds
      .map((id) => travel.calendar.find((item) => item.id === id))
      .filter(Boolean),
    sideTrips: market.sideTripKeys.map((key) => [key, travel.tourSideMinimums[key]]).filter(([, value]) => value)
  };
}
