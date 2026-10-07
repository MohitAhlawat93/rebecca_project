export const MULTILINGUAL_QUALITY = {
  schemaVersion: 1,
  primaryLanguage: 'en',
  publishStatus: 'seo-approved',
  reviewWorkflow: ['draft', 'machine-assisted', 'editorial-reviewed', 'native-reviewed', 'seo-approved'],
  rules: {
    requireNativeReviewForIndexing: true,
    requireSelfCanonical: true,
    requireReciprocalHreflang: true,
    requireTranslatedTitle: true,
    requireTranslatedDescription: true,
    maxSourceSimilarityForApprovedLocale: 0.72,
    targetScriptMinimum: {
      'zh-CN': 0.45,
      hi: 0.45
    }
  },
  locales: {
    en: {
      label: 'English',
      status: 'seo-approved',
      nativeReviewRequired: false,
      pages: { '*': 'seo-approved' }
    },
    zh: {
      label: '简体中文',
      hreflang: 'zh-CN',
      status: 'editorial-reviewed',
      nativeReviewRequired: true,
      priority: 1,
      targetAudience: 'Simplified Chinese readers in Singapore and regional/international visitors',
      pages: {
        home: 'editorial-reviewed',
        about: 'machine-assisted',
        rates: 'machine-assisted',
        travel: 'machine-assisted',
        contact: 'machine-assisted',
        'date-ideas': 'draft',
        favourites: 'draft',
        gallery: 'draft',
        etiquette: 'draft',
        reviews: 'draft',
        journal: 'draft',
        press: 'draft'
      },
      glossary: {
        'Risqué Rebecca': 'Risqué Rebecca',
        Singapore: '新加坡',
        'private companion': '私人陪伴',
        travel: '旅行',
        rates: '价格',
        reviews: '评价',
        etiquette: '礼仪与须知'
      },
      notes: 'Highest-priority non-English locale. Keep noindex until native review and full-body translation quality gates pass.'
    },
    hi: {
      label: 'हिंदी',
      status: 'machine-assisted',
      nativeReviewRequired: true,
      priority: 3,
      pages: { '*': 'machine-assisted' },
      notes: 'Available for user experience, but search publication is deferred until demand and native review justify it.'
    },
    fr: {
      label: 'Français',
      status: 'machine-assisted',
      nativeReviewRequired: true,
      priority: 4,
      pages: { '*': 'machine-assisted' },
      notes: 'Available for user experience, but not an indexed search asset yet.'
    },
    es: {
      label: 'Español',
      status: 'machine-assisted',
      nativeReviewRequired: true,
      priority: 5,
      pages: { '*': 'machine-assisted' },
      notes: 'Available for user experience, but not an indexed search asset yet.'
    }
  }
};

export function localePageStatus(languageId, pageId) {
  const locale = MULTILINGUAL_QUALITY.locales[languageId];
  if (!locale) return 'draft';
  return locale.pages?.[pageId] || locale.pages?.['*'] || locale.status || 'draft';
}
