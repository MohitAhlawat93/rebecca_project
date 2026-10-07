// Template for future client/country geo authority.
// Keep the shared engine unchanged. Replace only market-specific editorial configuration.
// Publish a hub only when it can provide genuinely different local value.
export const GEO_AUTHORITY = {
  schemaVersion: 1,
  id: 'client-country-authority',
  country: {
    name: 'Country or City',
    code: 'XX',
    slug: 'city',
    path: '/city',
    title: 'Client’s City Guide — Neighbourhoods & Local Notes',
    description: 'A useful, original city guide built around the client’s real interests and local experience.',
    eyebrow: 'Client’s City',
    heading: 'Different neighbourhoods for different moods.',
    intro: 'Explain why this city hub exists and what useful perspective the client adds.',
    perspective: [
      'Describe the client’s real connection to the city and the interests that shape the guide.',
      'State the editorial/fact-checking policy and avoid pretending changing venue information is permanent.'
    ],
    source: {
      label: 'Official destination source',
      url: 'https://www.example.com/'
    },
    lastFactCheck: 'YYYY-MM-DD'
  },
  launchLimit: 4,
  minimumEditorialCharacters: 900,
  maximumPairwiseSimilarity: 0.58,
  hubs: [
    {
      id: 'district-one',
      slug: 'district-one',
      name: 'District One',
      shortLabel: 'Distinct mood · distinct use',
      title: 'District One — A Useful Local Guide',
      description: 'Write a unique description based on genuine local value, not a swapped place name.',
      hero: 'One clear reason this district deserves its own page.',
      placeType: 'Neighbourhood',
      source: {
        label: 'Official local source',
        url: 'https://www.example.com/district-one'
      },
      facts: [
        'Verifiable local fact one.',
        'Verifiable local fact two.',
        'Verifiable local fact three.'
      ],
      sections: [
        { heading: 'Why this area works', body: 'Original editorial guidance.' },
        { heading: 'A good rhythm', body: 'A genuinely different way to use this area.' },
        { heading: 'The client’s lens', body: 'Connect the area to real client interests or experience.' },
        { heading: 'Practical planning note', body: 'Useful logistics that are not copied across every hub.' }
      ],
      goodFor: ['Use case one', 'Use case two'],
      related: []
    }
  ]
};
