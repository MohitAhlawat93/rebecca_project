# SEARCH Platform — reusable SEO/search foundation

This project now treats SEO as a reusable platform capability rather than Rebecca-specific markup.

## Principle

Shared code owns technical behavior. A client config owns brand, market, domain, languages and public-page inventory.

This means a future site for a client in Singapore, India, UAE, UK, US or another market can reuse the same engine while changing only configuration and approved content.

## SEARCH-00 configuration

Default config: `seo/site.config.mjs`

Template for future clients: `seo/site.config.example.mjs`

Override at runtime/build time:

- `CLIENT_CONFIG_PATH` — config file to use.
- `SITE_ORIGIN` — active origin for generated canonical, Open Graph, hreflang, sitemap and JSON-LD URLs.
- `PRODUCTION_SITE_ORIGIN` — final primary domain.
- `SEO_MODE` — normally `staging` or `production`.
- `INDEXING_ENABLED` — explicit search-indexing switch.
- `SEO_LASTMOD` — optional YYYY-MM-DD sitemap date when content genuinely changed.

## Safe workflow

Preview changes without editing files:

```bash
npm run seo:render
```

Apply generated SEO metadata:

```bash
npm run seo:render:write
```

Validate the source/config baseline:

```bash
npm run validate:seo
```

After rendering, validate exact canonical/robots state:

```bash
SEO_VALIDATE_RENDERED=true npm run validate:seo
```

## Multilingual quality gate

A language is not automatically an SEO asset simply because a URL exists.

Each language has a `searchStatus`, plus independent `includeInSitemap` and `includeInHreflang` switches. This lets future clients publish a language only after the copy is genuinely reviewed for that market rather than indexing low-quality machine translations.

For Rebecca, English is SEO-approved. Simplified Chinese is the priority next locale, while Hindi, French and Spanish remain available for visitor convenience but are not search-published until page-level quality review is complete.

## Domain migration

The domain is intentionally configuration-driven. We can finish the new site on Vercel and switch to `risquerebecca.com` near the end without manually editing canonical URLs across dozens of pages.

The final migration phase will separately preserve valuable legacy URLs and redirects. SEARCH-00 does not perform the domain cutover.

## Reuse for future clients

Do not copy Rebecca-specific values into shared engine files. For a new client:

1. Copy the example config.
2. Set brand/entity values.
3. Set primary country, locale, currency and timezone.
4. Define approved languages and URL prefixes.
5. Define the site's real public page inventory.
6. Set staging and production origins.
7. Run render + validation.

Location hubs, travel pages, schema types and language rollout remain client/market decisions in later SEARCH phases; the technical engine remains shared.

## SEARCH-01 — crawlability and build prerendering

Search-critical content is now rendered during the build by executing the same browser renderer used at runtime. This avoids a second copy of rates, reviews, travel, profile, etiquette, journal, press and other public content.

The build flow is:

```text
canonical client data
        ↓
content.js renderer
        ↓
server-side DOM build prerender
        ↓
raw crawlable HTML
        ↓
SEO metadata/canonical/hreflang render
        ↓
runtime hydration from Rebecca Control / public-content API
```

Only page/language combinations with `seo-approved` status are prerendered/indexed as search assets. Other translations may remain available to visitors without being emitted into sitemap/hreflang search surfaces.

Commands:

```bash
npm run validate:prerender
npm run prepare:search
npm run validate:search:rendered
npm run vercel-build
```

GitHub CI runs both the source validation and the future Vercel build command. This lets us verify the generated crawlable HTML without consuming a Vercel preview deployment.

For future clients, keep the prerender engine shared and change the client config: page inventory, approved languages, required crawlable bindings, market/domain settings and renderer entry point.

## SEARCH-02 — semantic geo authority and curated micro-hubs

SEARCH-02 adds a reusable geo-authority layer for sites that genuinely benefit from location content.

Shared pieces:

- `lib/geo-authority-engine.mjs` — rendering, BreadcrumbList/Place/WebPage schema and duplicate-content checks.
- `scripts/generate-geo-hubs.mjs` — deterministic build generation.
- `scripts/validate-geo-hubs.mjs` — quality gates.
- `seo/geo-hubs.config.example.mjs` — reusable client/country template.

Rebecca-specific configuration lives only in `seo/geo-hubs.config.mjs`.

The first launch cluster is deliberately small:

```text
/singapore
  ├── /singapore/marina-bay
  ├── /singapore/orchard-road
  └── /singapore/sentosa
```

The validator prevents this layer from turning into low-value programmatic SEO. It checks page uniqueness, minimum editorial depth, source evidence, duplicate titles/slugs and pairwise content similarity. The configured launch limit prevents silently generating dozens of neighbourhood pages.

A new client can reuse the same engine with a different country/city, source set, page hierarchy and neighbourhood configuration. Geo pages are generated before the general SEO render, so canonical URLs, robots rules and sitemap membership still flow through SEARCH-00.

The location pages are editorial guides, not a substitute for live venue information. Facts should be checked against authoritative local sources and changing venue details should be verified directly.

## SEARCH-03 — persistent global travel authority

Travel SEO now treats destinations as durable entities rather than disposable campaign URLs.

Rebecca's initial verified cluster is:

```text
/travel
  ├── /travel/london
  ├── /travel/hong-kong
  └── /travel/india
```

Dates live inside these pages. A future London announcement updates `/travel/london`; it does not create `/travel/london-december-2027`.

Shared components:

- `lib/travel-authority-engine.mjs` — permanent page rendering, public-window status and structural validation.
- `scripts/generate-travel-hubs.mjs` — deterministic destination generation.
- `scripts/validate-travel-hubs.mjs` — evidence, dated-slug and rendered-output checks.
- `seo/travel-authority.config.example.mjs` — template for another client/country.

Rebecca-specific evidence is read from the same canonical travel data already used by the public site and concierge. Rates, announced dates and regional travel minimums are not copied into a second manual source.

Quality rules:

1. A travel destination must have durable canonical evidence.
2. Dated or seasonal slugs are rejected.
3. A multi-city tour stays consolidated when the cities share the same rate/rule and lack distinct long-term content.
4. A destination can remain useful between public visits; no fake future date is required.
5. New destinations such as Dubai should not be generated until client-specific evidence justifies them.

The build order now generates persistent travel pages and Singapore geo pages before SEARCH-01 prerendering and SEARCH-00 metadata/sitemap rendering.

## SEARCH-04 — multilingual search quality

SEARCH-04 separates visitor translation from search publication.

The reusable workflow is:

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

Only `seo-approved` page/language combinations can enter sitemap, hreflang and indexing output.

Shared components:

- `lib/multilingual-quality-engine.mjs` — page-level status, visible-text, script-ratio and source-similarity helpers.
- `scripts/validate-multilingual-quality.mjs` — content, hreflang and sitemap quality gate.
- `seo/multilingual-quality.config.example.mjs` — reusable workflow for future clients/languages.
- `seo/multilingual-quality.config.mjs` — Rebecca-specific rollout state.

The engine supports locale metadata such as `htmlLang`, `ogLocale` and text direction, so the same architecture works for LTR and RTL markets.

For Rebecca:

- English is SEO-approved.
- Simplified Chinese is priority 1 but is not indexed yet because the current raw pages still contain substantial English/source-language body content.
- Hindi, French and Spanish remain available as runtime/user-experience translations but are deliberately excluded from serious search publication.

The validator prevents an unfinished translation from entering search simply because a route exists. An SEO-approved localized page must have translated metadata, sufficiently localized visible content, correct language metadata, reciprocal hreflang, sitemap membership and native-review evidence when required.

This follows the principle that translated UX and indexable localized SEO are separate release decisions.
