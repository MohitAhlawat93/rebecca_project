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
