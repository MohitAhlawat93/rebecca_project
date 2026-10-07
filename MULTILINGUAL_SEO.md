# Multilingual Search Quality — SEARCH-04

The site currently has public route folders for English, Simplified Chinese, Hindi, French and Spanish.

Those routes are **not automatically search assets**.

## Current publication state

- English: SEO-approved and eligible for sitemap/hreflang/indexing.
- Simplified Chinese: highest-priority next locale, but still held behind the quality gate.
- Hindi: runtime/user-experience translation available; search publication deferred.
- French: runtime/user-experience translation available; search publication deferred.
- Spanish: runtime/user-experience translation available; search publication deferred.

The existing non-English pages were originally built with localized metadata and partial static copy while much of the visible body still depended on runtime translation. SEARCH-04 prevents those partial pages from being treated as fully localized SEO pages.

## Review workflow

```text
draft
  ↓
machine-assisted
  ↓
editorial-reviewed
  ↓
native-reviewed
  ↓
seo-approved
```

Only `seo-approved` pages can enter the serious search surface.

A non-English page is not promoted merely because the route exists or because an AI translation is available.

## Automated quality gates

For approved localized pages the build checks:

- correct `html lang`
- locale direction support (`ltr` / `rtl`)
- localized Open Graph locale
- translated title
- translated meta description
- body similarity against the source language
- target-script ratio where useful (for example Simplified Chinese or Hindi)
- native-review evidence when configured
- self canonical
- reciprocal hreflang
- sitemap membership
- no leakage of unapproved localized URLs into sitemap/hreflang output

## Simplified Chinese priority

Chinese is the first non-English locale we plan to promote because it is strategically relevant to Rebecca's Singapore/Asia audience.

However, it remains non-indexable until the complete visible body and important facts are reviewed. Runtime translation alone is not considered sufficient for SEO approval.

## Runtime translation

The existing translation API remains useful for visitors. It preserves numbers, prices, currency codes, dates, durations, contact details and brand/publication names.

Runtime translation and SEO publication are intentionally separate systems:

```text
Visitor language convenience
        ≠
Search-engine publication approval
```

This distinction is required for every future client site as well.
