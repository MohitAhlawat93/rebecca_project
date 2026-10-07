// Reusable template for a client's permanent travel authority.
// Keep destination URLs stable. Dates belong inside the page, never in the slug.
export const TRAVEL_AUTHORITY = {
  schemaVersion: 1,
  id: 'client-global-travel',
  asOf: 'YYYY-MM-DD',
  rootPath: '/travel',
  launchLimit: 4,
  prohibitDatedSlugs: true,
  source: {
    label: 'Client’s canonical public travel source',
    url: 'https://www.example.com/travel'
  },
  principles: [
    'Create a destination page only when the client has durable evidence or recurring relevance.',
    'Keep public dates inside the permanent destination page.',
    'Do not split one shared itinerary into thin city pages without unique long-term value.'
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
      calendarIds: [],
      sideTripKeys: [],
      sideTripLabels: {},
      title: 'Client in London — Travel Dates & Guidance',
      description: 'A permanent London travel page that survives changing tour dates.',
      eyebrow: 'London · permanent travel hub',
      hero: 'Explain why London deserves one durable URL.',
      intro: 'Keep stable destination guidance here and update public dates inside the page.',
      editorial: [
        { heading: 'Why this URL stays', body: 'Explain the durable value.' },
        { heading: 'How to use this page', body: 'Explain current-vs-future travel information.' }
      ]
    }
  ]
};

// A client adapter should return durable evidence from that client's canonical data store.
export function travelEvidenceFor(market) {
  return {
    rateSet: null,
    calendar: [],
    sideTrips: []
  };
}
