import { MULTILINGUAL_QUALITY, localePageStatus } from './multilingual-quality.config.mjs';
import { TRAVEL_PAGES } from './travel-authority.config.mjs';
import { GEO_PAGES } from './geo-hubs.config.mjs';

const normalizeOrigin = (value) => String(value || '').trim().replace(/\/+$/, '');
const boolFromEnv = (name, fallback) => {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return /^(1|true|yes|on)$/i.test(value);
};

const mode = process.env.SEO_MODE || 'staging';
const origin = normalizeOrigin(process.env.SITE_ORIGIN || 'https://rebeccaproject.vercel.app');
const productionOrigin = normalizeOrigin(
  process.env.PRODUCTION_SITE_ORIGIN || 'https://www.risquerebecca.com'
);

export default {
  schemaVersion: 1,
  client: {
    id: 'risque-rebecca',
    brandName: 'Risqué Rebecca',
    publicName: 'Risqué Rebecca',
    entityType: 'Person'
  },
  multilingualQuality: MULTILINGUAL_QUALITY,
  market: {
    primaryCountry: 'SG',
    primaryRegion: 'Singapore',
    primaryLocale: 'en-SG',
    currency: 'SGD',
    timeZone: 'Asia/Singapore'
  },
  deployment: {
    mode,
    origin,
    productionOrigin,
    indexingEnabled: boolFromEnv('INDEXING_ENABLED', mode === 'production')
  },
  seo: {
    siteName: 'Risqué Rebecca',
    defaultOgImage:
      'https://images.squarespace-cdn.com/content/v1/68806c9f433a21762c9e1a86/65d6926c-8342-4873-9532-2d809b0dccc1/processed__DSC9552-censored.jpeg',
    maxImagePreview: 'large',
    excludedPrefixes: ['/api/', '/admin', '/admin.html'],
    legacyCanonicalOrigins: ['https://rebeccaproject.vercel.app']
  },
  languages: [
    {
      id: 'en',
      hreflang: 'en',
      htmlLang: 'en',
      prefix: '',
      searchStatus: MULTILINGUAL_QUALITY.locales.en.status,
      pageSearchStatus: MULTILINGUAL_QUALITY.locales.en.pages,
      includeInSitemap: true,
      includeInHreflang: true
    },
    {
      id: 'zh',
      hreflang: 'zh-CN',
      htmlLang: 'zh-CN',
      prefix: '/zh',
      searchStatus: MULTILINGUAL_QUALITY.locales.zh.status,
      pageSearchStatus: MULTILINGUAL_QUALITY.locales.zh.pages,
      includeInSitemap: true,
      includeInHreflang: true
    },
    {
      id: 'hi',
      hreflang: 'hi',
      htmlLang: 'hi',
      prefix: '/hi',
      searchStatus: MULTILINGUAL_QUALITY.locales.hi.status,
      pageSearchStatus: MULTILINGUAL_QUALITY.locales.hi.pages,
      includeInSitemap: true,
      includeInHreflang: true
    },
    {
      id: 'fr',
      hreflang: 'fr',
      htmlLang: 'fr',
      prefix: '/fr',
      searchStatus: MULTILINGUAL_QUALITY.locales.fr.status,
      pageSearchStatus: MULTILINGUAL_QUALITY.locales.fr.pages,
      includeInSitemap: true,
      includeInHreflang: true
    },
    {
      id: 'es',
      hreflang: 'es',
      htmlLang: 'es',
      prefix: '/es',
      searchStatus: MULTILINGUAL_QUALITY.locales.es.status,
      pageSearchStatus: MULTILINGUAL_QUALITY.locales.es.pages,
      includeInSitemap: true,
      includeInHreflang: true
    }
  ],
  travelAuthority: {
    enabled: true,
    module: 'seo/travel-authority.config.mjs',
    generatedAtBuild: true
  },
  geoAuthority: {
    enabled: true,
    module: 'seo/geo-hubs.config.mjs',
    generatedAtBuild: true
  },
  prerender: {
    enabled: true,
    entry: 'content.js',
    runtimeHydration: true,
    approvedLanguagesOnly: true,
    requiredBindingsByPage: {
      'index.html': ['data-profile-hero-meta', 'data-profile-home-facts', 'data-home-trust'],
      'about.html': ['data-profile-about-facts', 'data-profile-philosophy', 'data-profile-interview', 'data-profile-faq'],
      'rates.html': ['data-singapore-rates', 'data-singapore-terms'],
      'travel.html': ['data-travel-calendar', 'data-fmty-grid', 'data-touring-rates', 'data-travel-practicalities'],
      'reviews.html': ['data-reputation-proof', 'data-reputation-reviews'],
      'journal.html': ['data-journal-entries'],
      'press.html': ['data-press-appearances'],
      'etiquette.html': ['data-screening-policy', 'data-deposit-grid', 'data-cancellation-policy', 'data-boundaries-policy'],
      'date-ideas.html': ['data-date-categories', 'data-wishlist-categories', 'data-wishlist-details'],
      'favourites.html': ['data-favourites-table', 'data-favourites-things', 'data-favourites-interests'],
      'contact.html': ['data-contact-channels', 'data-duration-options', 'data-screening-options']
    }
  },
  pages: [
    { id: 'home', path: '/', file: 'index.html', localized: true, priority: 1.0 },
    { id: 'about', path: '/about', file: 'about.html', localized: true, priority: 0.9 },
    { id: 'rates', path: '/rates', file: 'rates.html', localized: true, priority: 0.9 },
    { id: 'travel', path: '/travel', file: 'travel.html', localized: true, priority: 0.8 },
    { id: 'date-ideas', path: '/date-ideas', file: 'date-ideas.html', localized: true, priority: 0.7 },
    { id: 'favourites', path: '/favourites', file: 'favourites.html', localized: true, priority: 0.8 },
    { id: 'gallery', path: '/gallery', file: 'gallery.html', localized: true, priority: 0.8 },
    { id: 'etiquette', path: '/etiquette', file: 'etiquette.html', localized: true, priority: 0.8 },
    { id: 'reviews', path: '/reviews', file: 'reviews.html', localized: true, priority: 0.7 },
    { id: 'journal', path: '/journal', file: 'journal.html', localized: true, priority: 0.7 },
    { id: 'press', path: '/press', file: 'press.html', localized: true, priority: 0.7 },
    { id: 'contact', path: '/contact', file: 'contact.html', localized: true, priority: 0.9 },
    { id: 'professional', path: '/professional', file: 'professional.html', localized: false, priority: 0.7 },
    {
      id: 'selfies',
      path: '/selfies-of-risquerebecca',
      file: 'selfies-of-risquerebecca.html',
      localized: false,
      priority: 0.7
    },
    ...GEO_PAGES,
    ...TRAVEL_PAGES
  ]
};
