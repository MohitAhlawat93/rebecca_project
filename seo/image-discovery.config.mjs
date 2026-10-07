import { REBECCA_IMAGES } from '../data/rebecca-images.js';

const first = (key, fallback = REBECCA_IMAGES.professional[0]) =>
  (REBECCA_IMAGES.curated[key] || [])[0] || fallback;

export const IMAGE_DISCOVERY = {
  schemaVersion: 1,
  id: 'risque-rebecca-images',
  sitemapPath: '/image-sitemap.xml',
  sourceHost: 'images.squarespace-cdn.com',
  migrateToOwnedHostLater: true,
  rights: {
    status: 'public-site-reuse-approved',
    copyrightNotice: 'Photography is original or used with permission unless otherwise credited.',
    licenseUrl: null,
    acquireLicensePage: null,
    creditText: null,
    creator: null
  },
  rules: {
    requireStandardImgElement: true,
    requireAlt: true,
    maxAltLength: 160,
    disallowKeywordStuffing: true,
    requirePageSpecificPrimaryImage: true,
    requireImageSitemap: true,
    maxImagesPerLandingPage: 1000
  },
  pages: {
    home: {
      primary: first('hero'),
      alt: 'Risqué Rebecca editorial portrait on the homepage',
      images: REBECCA_IMAGES.curated.hero || []
    },
    about: {
      primary: first('aboutFeature', first('about')),
      alt: 'Risqué Rebecca editorial portrait on the About page',
      images: unique([...(REBECCA_IMAGES.curated.aboutFeature || []), ...(REBECCA_IMAGES.curated.about || [])])
    },
    travel: {
      primary: first('travel'),
      alt: 'Risqué Rebecca editorial portrait on the Travel page',
      images: REBECCA_IMAGES.curated.travel || []
    },
    'date-ideas': {
      primary: first('dateIdeas'),
      alt: 'Risqué Rebecca editorial portrait on the Date Ideas page',
      images: REBECCA_IMAGES.curated.dateIdeas || []
    },
    favourites: {
      primary: first('favouritesHero', first('favourites')),
      alt: 'Risqué Rebecca editorial portrait on the Food and Favourites page',
      images: unique([...(REBECCA_IMAGES.curated.favouritesHero || []), ...(REBECCA_IMAGES.curated.favourites || [])])
    },
    gallery: {
      primary: first('galleryProfessional'),
      alt: 'Selected public photography of Risqué Rebecca',
      images: unique([
        ...(REBECCA_IMAGES.curated.galleryProfessional || []),
        ...(REBECCA_IMAGES.curated.galleryCandid || [])
      ])
    },
    reviews: {
      primary: first('reviews'),
      alt: 'Risqué Rebecca editorial portrait on the Reviews page',
      images: REBECCA_IMAGES.curated.reviews || []
    },
    journal: {
      primary: first('journal'),
      alt: 'Risqué Rebecca editorial portrait on the Journal page',
      images: REBECCA_IMAGES.curated.journal || []
    },
    press: {
      primary: first('press'),
      alt: 'Risqué Rebecca editorial portrait on the Press page',
      images: REBECCA_IMAGES.curated.press || []
    },
    etiquette: {
      primary: first('etiquette'),
      alt: 'Risqué Rebecca editorial portrait on the Etiquette page',
      images: REBECCA_IMAGES.curated.etiquette || []
    },
    professional: {
      primary: REBECCA_IMAGES.professional[0],
      alt: 'Risqué Rebecca professional editorial portrait archive',
      images: REBECCA_IMAGES.professional,
      archiveAltPrefix: 'Risqué Rebecca professional editorial portrait'
    },
    selfies: {
      primary: REBECCA_IMAGES.candid[0],
      alt: 'Risqué Rebecca candid public photography archive',
      images: REBECCA_IMAGES.candid,
      archiveAltPrefix: 'Risqué Rebecca candid public photograph'
    }
  }
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
