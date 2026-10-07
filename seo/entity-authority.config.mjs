import { REBECCA_DATA } from '../data/rebecca-data.js';

const sameEntity = REBECCA_DATA.press.externalProfiles.filter(
  (item) => item.verified && item.relationship === 'same-entity'
);
const related = REBECCA_DATA.press.externalProfiles.filter(
  (item) => item.verified && item.relationship === 'related'
);

export const ENTITY_AUTHORITY = {
  schemaVersion: 1,
  id: 'risque-rebecca-entity',
  entity: {
    type: 'Person',
    idSuffix: '#rebecca',
    name: REBECCA_DATA.profile.displayName,
    alternateName: ['Rebecca'],
    homepagePath: '/',
    profilePath: '/about',
    description:
      'Risqué Rebecca is a Singapore-based independent public persona established since 2015, with first-person writing, third-party press coverage and a multi-year public review record.',
    homeLocation: REBECCA_DATA.profile.base,
    languages: REBECCA_DATA.profile.languages,
    establishedSince: REBECCA_DATA.profile.establishedSince
  },
  identity: {
    verifiedSameAs: sameEntity,
    relatedProfiles: related,
    candidates: []
  },
  evidence: {
    press: REBECCA_DATA.press.appearances,
    authoredWorks: REBECCA_DATA.journal.entries,
    reviews: REBECCA_DATA.reputation.reviews
  },
  reviewPolicy: {
    emitReviewSchema: false,
    emitAggregateRating: false,
    exactSourceUrlRequiredForReviewMarkup: true,
    reason:
      'The site republishes excerpts/summaries from named third-party review platforms but does not store exact public URLs for every review. It must not manufacture self-serving Review or AggregateRating rich-result markup.'
  },
  pageMap: {
    home: 'home',
    about: 'profile',
    reviews: 'reputation',
    press: 'press',
    journal: 'authored'
  }
};
