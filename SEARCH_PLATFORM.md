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

For Rebecca, English is approved. Existing Chinese, Hindi, French and Spanish routes remain available in the codebase but are marked `review-required` in the new SEO config until language quality is reviewed.

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

Only languages marked `searchStatus: approved` are prerendered/indexed as search assets. Existing review-required languages remain available to the application but are kept out of the serious search surface until content quality is approved.

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
