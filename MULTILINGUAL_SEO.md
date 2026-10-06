# Multilingual SEO — Phase 7G

Localized public routes now exist for English, Simplified Chinese, Hindi, French and Spanish across the main discovery and booking pages.

Examples:
- English: /rates
- Chinese: /zh/rates
- Hindi: /hi/rates
- French: /fr/rates
- Spanish: /es/rates

Each localized route has a self-referencing canonical, localized title/description, static localized hero copy, hreflang links for en / zh-CN / hi / fr / es / x-default, and sitemap inclusion.

The remainder of each page uses the shared translation layer. Phase 7G caches translations across pages in localStorage and translates missing strings in parallel batches for faster repeat navigation.
