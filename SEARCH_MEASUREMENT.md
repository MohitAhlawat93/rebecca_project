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


## SEARCH-08 — Automated Search Data Sync & Persistence

SEARCH-08 turns the SEARCH-07 measurement layer into a durable historical data pipeline.

### Runtime architecture

```text
Google Search Console / Bing Webmaster
              ↓
       provider OAuth / API key
              ↓
      server-side token manager
              ↓
       scheduled Vercel Cron
              ↓
      normalized search metrics
              ↓
           Supabase
              ↓
       persisted history
              ↓
   SEARCH-07 intelligence engine
              ↓
      Rebecca Control / future UI
```

Supabase stores search history and encrypted provider credentials. Vercel runs the collector. Browser code never receives provider secrets.

### Persistence tables

SEARCH-08 uses four isolated tables:

```text
search_provider_connections
search_metric_rows
search_sync_runs
search_sync_state
```

The schema is multi-client-ready: every row is keyed by `client_id`.

The search tables are separate from Rebecca Control content, media, concierge and recovery-state tables.

### Security model

All four public-schema tables have Row Level Security enabled.

The Data API receives only `SELECT`, `INSERT` and `UPDATE` grants for the server-side integration role used by this project. There is no Data API delete grant.

Rows carry a hash of a dedicated `SEARCH_STORE_SECRET`. Server requests send the matching `x-search-store-secret` header and RLS checks its SHA-256 digest.

Google/Bing OAuth access and refresh tokens are encrypted **before** they are written to Supabase using AES-256-GCM. The encryption key exists only as the server-side `SEARCH_TOKEN_ENCRYPTION_KEY` environment variable.

Do not expose:

```text
SEARCH_STORE_SECRET
SEARCH_TOKEN_ENCRYPTION_KEY
SEARCH_OAUTH_STATE_SECRET
CRON_SECRET
provider client secrets
provider access/refresh tokens
```

to browser code.

### OAuth connection flow

The owner-facing connection flow is:

```text
Rebecca Control owner session
        ↓
/api/admin/search-connect
        ↓
Google or Bing consent screen
        ↓
signed, expiring OAuth state
        ↓
/api/admin/search-oauth-callback
        ↓
authorization-code exchange
        ↓
tokens encrypted
        ↓
search_provider_connections
```

OAuth state is HMAC-signed, includes a nonce and expires after ten minutes.

Google requests the read-only Search Console scope with offline access so a refresh token can support scheduled collection.

Bing requests the read-only `Webmaster.read` scope.

### Token lifecycle

At sync time:

1. Reuse a stored access token when it remains valid.
2. Otherwise use the encrypted refresh token to obtain a new access token.
3. Encrypt and persist the refreshed token set.
4. Fall back to legacy server-side environment credentials when available.
5. Report `needs-connection` instead of inventing zero search performance when no credential exists.

### Automated sync

The production configuration schedules:

```text
/api/cron/search-sync
23 4 * * *
```

That is one daily production sync at 04:23 UTC.

Vercel sends `Authorization: Bearer <CRON_SECRET>`; the endpoint rejects requests that do not match the configured secret.

The job syncs a finalized rolling window. Current defaults are:

```text
finalization lag = 3 days
sync lookback    = 35 days
providers        = Google + Bing
```

The overlapping 35-day window is intentional. Provider data can settle after its first appearance, and deterministic row keys make the overlap safe.

### Idempotency and recovery

Metric rows use deterministic keys derived from:

```text
client
source
surface
date
query
page
country
device
topic
intent
```

Re-running a window updates the same records instead of creating duplicates.

Every run also writes:

- provider
- trigger
- window
- result status
- rows written
- start/end timestamps
- safe error code/message

`search_sync_state` tracks last attempt, last success, last completed window and consecutive failures.

This allows a future dashboard to distinguish:

```text
healthy
never connected
temporarily failing
refresh required
stale data
export required
```

### Export-only AI data

Google Generative AI, Google multimodal and Bing AI Performance remain export-only surfaces until their public APIs support the required report data.

SEARCH-08 persists those exports through the same normalized history layer rather than analyzing them only in-memory.

Supported import kinds:

```text
google-generative-ai
google-multimodal
bing-ai-performance
```

Imports are content-hashed so submitting the same export twice is idempotent.

### Search Intelligence API

`GET /api/admin/search-intelligence` now reads persisted history by default.

```text
?mode=persisted   default historical view
?mode=live        diagnostic/transient provider request
```

A temporary provider outage therefore does not erase the most recent historical picture.

### One-time provider setup

The platform code is ready, but live automated collection does not pretend to be connected until real provider credentials exist.

Google requires:

```text
GOOGLE_SEARCH_CLIENT_ID
GOOGLE_SEARCH_CLIENT_SECRET
GSC_SITE_URL
```

Bing requires:

```text
BING_WEBMASTER_CLIENT_ID
BING_WEBMASTER_CLIENT_SECRET
BING_SITE_URL
```

The OAuth callback is:

```text
<SEARCH_OAUTH_REDIRECT_ORIGIN>/api/admin/search-oauth-callback
```

For the current Vercel production alias, `SEARCH_OAUTH_REDIRECT_ORIGIN` is configured to the production Vercel hostname. When the final custom domain is cut over, register/update the appropriate callback in the provider OAuth apps before changing the origin.

### Reuse for future clients

Shared sync/storage logic is client-neutral. For another site, configure:

- `clientId`
- production domain/property
- Google/Bing OAuth app credentials
- provider property/site URL
- sync cadence/lookback
- search thresholds

The same persistence tables can separate tenants by `client_id`, or each client deployment can use its own Supabase project.
