// Copy this file for a new client and point CLIENT_CONFIG_PATH to it.
// The SEO engine is shared; only client/market/language/page data should change.
export default {
  schemaVersion: 1,
  client: {
    id: 'client-slug',
    brandName: 'Client Brand',
    publicName: 'Client Public Name',
    entityType: 'Person'
  },
  market: {
    primaryCountry: 'US',
    primaryRegion: 'New York',
    primaryLocale: 'en-US',
    currency: 'USD',
    timeZone: 'America/New_York'
  },
  deployment: {
    mode: process.env.SEO_MODE || 'staging',
    origin: (process.env.SITE_ORIGIN || 'https://example.vercel.app').replace(/\/+$/, ''),
    productionOrigin: (process.env.PRODUCTION_SITE_ORIGIN || 'https://www.example.com').replace(/\/+$/, ''),
    indexingEnabled: process.env.INDEXING_ENABLED === 'true'
  },
  seo: {
    siteName: 'Client Brand',
    defaultOgImage: 'https://www.example.com/og.jpg',
    maxImagePreview: 'large',
    excludedPrefixes: ['/api/', '/admin'],
    legacyCanonicalOrigins: ['https://example.vercel.app']
  },
  travelAuthority: {
    enabled: false,
    module: 'seo/travel-authority.config.example.mjs',
    generatedAtBuild: true
  },
  geoAuthority: {
    enabled: false,
    module: 'seo/geo-hubs.config.example.mjs',
    generatedAtBuild: true
  },
  languages: [
    {
      id: 'en',
      hreflang: 'en',
      htmlLang: 'en',
      prefix: '',
      searchStatus: 'approved',
      includeInSitemap: true,
      includeInHreflang: true
    }
  ],
  pages: [
    { id: 'home', path: '/', file: 'index.html', localized: true, priority: 1.0 },
    { id: 'about', path: '/about', file: 'about.html', localized: true, priority: 0.8 }
  ]
};
