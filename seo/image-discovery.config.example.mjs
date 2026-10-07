export const IMAGE_DISCOVERY = {
  schemaVersion: 1,
  id: 'client-images',
  sitemapPath: '/image-sitemap.xml',

  // Prefer an image hostname the client controls. External/CDN URLs are supported,
  // but ownership/verification and long-term stability should be considered.
  sourceHost: 'images.example.com',
  migrateToOwnedHostLater: false,

  rights: {
    status: 'verified',
    copyrightNotice: '© Client. All rights reserved.',
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
      primary: 'https://images.example.com/home-portrait.jpg',
      alt: 'Client editorial portrait on the homepage',
      images: ['https://images.example.com/home-portrait.jpg']
    },
    gallery: {
      primary: 'https://images.example.com/gallery-01.jpg',
      alt: 'Selected public photography of Client',
      images: [
        'https://images.example.com/gallery-01.jpg',
        'https://images.example.com/gallery-02.jpg'
      ],
      archiveAltPrefix: 'Client professional editorial photograph'
    }
  }
};

// Do not invent creator/credit/license metadata.
// Do not use keyword-stuffed alt text.
// Do not use image metadata to disguise, misclassify or bypass search safety systems.
