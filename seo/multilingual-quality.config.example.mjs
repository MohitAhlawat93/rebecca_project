export const MULTILINGUAL_QUALITY = {
  schemaVersion: 1,
  primaryLanguage: 'en',
  publishStatus: 'seo-approved',
  reviewWorkflow: [
    'draft',
    'machine-assisted',
    'editorial-reviewed',
    'native-reviewed',
    'seo-approved'
  ],
  rules: {
    requireNativeReviewForIndexing: true,
    requireSelfCanonical: true,
    requireReciprocalHreflang: true,
    requireTranslatedTitle: true,
    requireTranslatedDescription: true,
    maxSourceSimilarityForApprovedLocale: 0.72,
    targetScriptMinimum: {
      'zh-CN': 0.45,
      ar: 0.45,
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
    ar: {
      label: 'العربية',
      status: 'machine-assisted',
      nativeReviewRequired: true,
      pages: {
        home: 'machine-assisted',
        about: 'draft'
      },
      approvalEvidence: {
        // about: { reviewer: 'Native reviewer', reviewedAt: 'YYYY-MM-DD' }
      }
    }
  }
};

// Promotion rule:
// A localized page becomes "seo-approved" only after its visible body,
// title/description, important facts, navigation and client voice have
// passed review. Runtime translation alone is never enough for SEO approval.
