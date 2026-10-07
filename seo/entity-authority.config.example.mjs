// Reusable template for a client's entity/reputation/press graph.
// Only URLs verified to represent the same public entity belong in sameAs.
export const ENTITY_AUTHORITY = {
  schemaVersion: 1,
  id: 'client-entity',
  entity: {
    type: 'Person',
    idSuffix: '#person',
    name: 'Client Public Name',
    alternateName: [],
    homepagePath: '/',
    profilePath: '/about',
    description: 'A concise factual description of the public entity.',
    homeLocation: 'City, Country',
    languages: ['English'],
    establishedSince: 2020
  },
  identity: {
    verifiedSameAs: [
      // { label: 'Verified external profile', url: 'https://...', relationship: 'same-entity', verified: true }
    ],
    relatedProfiles: [
      // Partnerships/collaborations belong here, not in sameAs.
    ],
    candidates: [
      // Candidate identity references must never enter sameAs until verified.
    ]
  },
  evidence: {
    press: [
      // {
      //   outlet: 'Publisher',
      //   title: 'Article title',
      //   datePublished: 'YYYY-MM-DD',
      //   byline: 'Reporter',
      //   relationship: 'interview',
      //   url: 'https://...',
      //   note: 'Why this source matters.'
      // }
    ],
    authoredWorks: [
      // {
      //   title: 'Article title',
      //   datePublished: 'YYYY-MM-DD',
      //   outlet: 'Publisher',
      //   author: 'Client Public Name',
      //   url: 'https://...'
      // }
    ],
    reviews: [
      // Keep source/date/excerpt. Add sourceUrl only when the exact public review URL is verified.
    ]
  },
  reviewPolicy: {
    emitReviewSchema: false,
    emitAggregateRating: false,
    exactSourceUrlRequiredForReviewMarkup: true,
    reason: 'Do not manufacture self-serving review rich-result markup.'
  },
  pageMap: {
    home: 'home',
    about: 'profile',
    reviews: 'reputation',
    press: 'press',
    journal: 'authored'
  }
};
