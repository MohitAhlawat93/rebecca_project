# SEARCH-07 — Search Measurement & Intelligence

SEARCH-07 is the reusable measurement layer that turns search performance into reviewable evidence and recommendations.

It does **not** publish SEO changes automatically.

## Data architecture

```text
Google Search Console API ─┐
Google GenAI export ───────┤
Google multimodal export ──┤
Bing Webmaster API ────────┤
Bing AI Performance export ┤
                           ↓
                  normalized metric rows
                           ↓
                 period comparison engine
                           ↓
                  opportunity detection
                           ↓
               admin-ready intelligence API
```

## Normalized record

Every supported source is converted into the same shape:

```text
source
surface
date
query
page
country
device
clicks
impressions
ctr
position
citations
citedPages
topic
intent
```

A field can be empty when that provider/report does not expose it.

## Live/API capabilities

### Google standard Search Analytics

SEARCH-07 supports live Search Console Search Analytics API collection for approved credentials.

Current configured search types:

- web
- image

Current dimensions:

- date
- query
- page
- country
- device

The adapter paginates using the official 25,000-row maximum. The platform intentionally uses finalized data windows with a configurable lag instead of treating partial data as final.

### Google Generative AI

Google's 2026 Generative AI performance report exposes visibility such as impressions, pages, countries, devices and dates.

SEARCH-07 treats this as `report-export` because the public Search Analytics API documentation does not currently document a dedicated Generative AI API type/dimension.

### Google multimodal

Google's September 2026 Search Console multimodal filter covers Lens, Circle to Search, image uploads and related image-search flows.

SEARCH-07 treats this as `report-export` until a public Search Analytics API surface is documented.

### Bing standard performance

SEARCH-07 supports the Bing Webmaster JSON API authentication model with either OAuth bearer token or API key.

The adapter normalizes top-query and top-page traffic records.

### Bing AI Performance

Bing AI Performance includes visible citation activity, cited pages, grounding queries, topics/intents and trend information.

SEARCH-07 treats this as `portal-export` because a public AI Performance API is not currently documented.

## Required environment variables

No provider credential is stored in Git.

Google:

```text
GSC_SITE_URL
GSC_ACCESS_TOKEN
```

Bing:

```text
BING_SITE_URL

# one of:
BING_WEBMASTER_ACCESS_TOKEN
BING_WEBMASTER_API_KEY
```

The current access-token approach is deliberately simple infrastructure. A future account-connection phase can replace it with refresh-token/OAuth lifecycle management without changing the normalized intelligence engine.

## Reporting windows

Default:

```text
current period   = 28 finalized days
comparison       = previous 28 days
finalization lag = 3 days
```

For 7 October 2026 this resolves to:

```text
current  : 7 Sep 2026 → 4 Oct 2026
previous : 10 Aug 2026 → 6 Sep 2026
```

The values are client-configurable.

## Opportunity engine

The first reusable evidence rules are:

### High impressions + weak CTR

The page is already visible. Review title/description/search-intent fit before adding more content.

### Striking-distance query

A query with useful impressions and a position close enough to improve. Prefer strengthening the best existing page and internal links instead of generating a thin new page.

### Meaningful page decline

Compare current vs previous periods. This is an investigation signal, not an automatic diagnosis.

### Emerging query

A search need that newly gains meaningful visibility.

### Visual discovery

Image/multimodal impressions exist but click-through is weak. Review the representative image, context and landing-page fit.

### AI citation strength

A page is being cited by a supported AI search surface. Preserve factual clarity, source evidence and stable URLs when editing it.

## Guardrails

The intelligence layer cannot auto-publish.

Explicitly prohibited recommendations include:

- mass-generated location pages
- keyword stuffing
- fake backlinks
- fake reviews
- SafeSearch/classification evasion
- automatic publication of AI-generated SEO content

Every opportunity has `requiresReview: true`.

## Protected API

```text
GET/POST /api/admin/search-intelligence
```

The endpoint requires the existing Rebecca Control owner session and sends:

```text
Cache-Control: private, no-store
X-Robots-Tag: noindex, nofollow, noarchive
```

GET can return connection state or live aggregate data when configured.

POST can combine supported exports with live data for analysis. Credentials never appear in the response.

## Future dashboard

SEARCH-07 intentionally provides the data/service layer first.

A later Rebecca Control search dashboard can consume this API to show:

- clicks / impressions / CTR / average position
- page/query changes
- image and multimodal discovery
- Google generative-AI visibility
- Bing citations and grounding queries
- prioritized opportunities
- evidence behind each recommendation

The dashboard should never display a missing provider as zero performance; it must show `needs connection` or `export required`.
