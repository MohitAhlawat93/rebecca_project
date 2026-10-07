# Risqué Rebecca — Premium Website & AI Concierge

The current build is the Phase 6 editorial demo: Rebecca-first, responsive, privacy-conscious and built from her approved public website content and media.

## Public routes

- `/` — premium homepage
- `/about` — profile and personality
- `/rates` — current Singapore consideration
- `/travel` — touring and fly-me-to-you guidance
- `/date-ideas` — public date inspiration, wishlist direction and the private-list handoff
- `/gallery` — curated gallery hub
- `/professional` — complete 67-photo professional portrait archive
- `/selfies-of-risquerebecca` — complete 44-photo candid archive
- `/etiquette` — screening, deposits, privacy and policies
- `/reviews` — selected public testimonials
- `/contact` — privacy-first enquiry builder

## Rebecca’s Concierge

The concierge uses a lightweight local RAG pipeline:

1. `data/rebecca-data.js` is the single source of truth for mutable public facts: profile, rates, travel, policies, contact, date ideas, wishlist and gallery counts.
2. `content.js` renders factual website sections from that source.
3. `lib/rebecca-knowledge.js` derives retrieval chunks from the same source.
4. `api/concierge.js` derives direct and fallback answers from the same source before using Groq for broader grounded responses.
5. GitHub Actions runs `npm run validate:data` to catch missing bindings or accidental re-introduction of legacy duplicate data.

The default dynamic model is `openai/gpt-oss-20b` with reasoning disabled for speed and cost control. Set `GROQ_MODEL` to override it.

### Required Vercel environment variable

- `GROQ_API_KEY` — Groq API key used by `/api/chat`
- `GROQ_MODEL` — optional model override; defaults to `openai/gpt-oss-20b`

Without `GROQ_API_KEY`, the concierge still works for core public topics through the grounded fallback, but broader RAG-generated answers will not call Groq.

### RAG privacy boundary

The retrieval store is derived from the same canonical data used by the website. Do not maintain a second manual copy of profile, rates, travel, policies or contact facts inside concierge code.

The locked private Date Ideas venue list is deliberately excluded. The concierge must not reveal, guess or reconstruct it.

### Privacy rules

- Do not send ID documents, employer documents, financial information, passwords or other sensitive screening material to the concierge.
- Concierge history remains in the browser and is not replayed as trusted server context.
- Groq Responses requests use `store: false`.
- The enquiry builder does not submit visitor data to a database; it formats the enquiry locally for Rebecca’s verified channels.

## Main edit locations

- **Rebecca factual data (edit here first): `data/rebecca-data.js`**
- Page layout/editorial copy: each `.html` page
- Canonical-data page renderer: `content.js`
- Shared design system: `styles.css`
- Navigation, enquiry builder and concierge UI: `script.js`
- Derived RAG knowledge + retrieval: `lib/rebecca-knowledge.js`
- Concierge server endpoint: `api/concierge.js`
- Data validation: `scripts/validate-data.mjs`
- Vercel routing/security settings: `vercel.json`

## Production readiness

GitHub `main` is connected to Vercel. Production deployment is triggered by the eventual Phase 6 merge.

- Legacy paths with direct equivalents are either preserved as real pages or permanently redirected.
- `/professional` and `/selfies-of-risquerebecca` are preserved as real pages.
- CSP and baseline security headers are configured in `vercel.json`.
- `robots.txt`, `sitemap.xml`, canonical URLs and homepage structured data are prepared for the review domain.
- At custom-domain cutover, replace review-domain canonical/OG/sitemap/structured-data URLs with `https://www.risquerebecca.com`.
- See `LAUNCH_CHECKLIST.md` for the final cutover sequence.


## Rebecca Control — RC-01 + RC-02 integrated

The current site includes the private Rebecca Control foundation and Quick Control editor at `/admin`.

- RC-01: server-side owner authentication, signed HttpOnly session, login throttling, noindex/no-store admin boundary.
- RC-02: availability, travel, Singapore rates, contact details and core profile facts in one mobile-first editor.
- Public pages and the AI concierge consume the same effective runtime content.
- `data/rebecca-data.js` remains the fail-safe fallback if persistent runtime storage is unavailable.
- Normal owner edits do not require GitHub or a Vercel deployment after Rebecca's isolated runtime store is connected.
- Quick Control persists through a least-privilege Supabase RLS store using `RC_SUPABASE_URL`, `RC_SUPABASE_PUBLISHABLE_KEY` and a server-only `RC_STORE_SECRET`. The website never needs a Supabase service-role/master key.


### RC-02B persistence

Rebecca Control uses a deliberately narrow persistence model:

- Vercel holds a Supabase publishable key plus a separate high-entropy `RC_STORE_SECRET`.
- The browser never receives either the control secret or direct database access.
- Supabase RLS checks the server-only `x-rc-control-secret` header for the single `current` row.
- `anon` receives column-level SELECT/UPDATE only for the public content fields. It cannot insert/delete rows or read/change the stored secret hash.
- Optimistic version checks prevent one admin session from silently overwriting a newer edit.
- `data/rebecca-data.js` stays the canonical fail-safe if storage cannot be reached.

Required Vercel environment variables:
- `RC_SUPABASE_URL`
- `RC_SUPABASE_PUBLISHABLE_KEY`
- `RC_STORE_SECRET`

The current testing database belongs to Mohit's Supabase account. Before handoff, reproduce `supabase/rc-02-quick-control.sql` in Rebecca's Supabase project, set a fresh `RC_STORE_SECRET`, copy the current payload, and replace only these environment values.


## Rebecca Control — RC-03 Media & Publishing

RC-03 adds a safe media workflow without replacing the preserved photography archive.

Owner workflow:

```text
Upload / choose photos
        ↓
Save Draft
        ↓
Private Preview
        ↓
Publish
        ↓
Live website
```

Key behavior:
- Existing curated Squarespace images remain the safe fallback.
- New uploads go directly from the owner's browser to the project's public Vercel Blob store.
- Upload authorization requires a valid Rebecca Control owner session.
- Accepted formats: JPG, PNG, WebP and AVIF, up to 25 MB.
- A media Draft never changes the public website.
- Private draft preview uses `?rc_preview=1` and requires the authenticated owner session.
- Published media overrides only the selected curated placement; the legacy professional/candid archives stay intact.
- Published history retains up to 12 previous states. Restore sends an older version back to Draft first; it does not silently republish it.
- Optimistic version matching protects against one admin tab overwriting newer media edits.
- Blob images are supported by the existing rotators without Squarespace-specific resize query parameters.

Current editable placements:
- Homepage rotation
- About feature + About editorial
- Reviews
- Travel
- Favourites hero + editorial
- Journal
- Press
- Gallery professional/candid previews
- Date ideas
- Etiquette

Storage:
- image files → Vercel Blob store `rebecca-media`
- draft / published metadata / history → Supabase `rebecca_media_state`
- portable schema → `supabase/rc-03-media-publishing.sql`

The current Supabase state is temporary in Mohit's account. At Rebecca handoff, apply the schema in her project, use a fresh `RC_STORE_SECRET`, copy the media state, and update the existing Vercel persistence environment variables. Media files can remain in the project's Blob store while the same Vercel project is retained; otherwise migrate Blob assets during infrastructure handoff.


## Rebecca Control — RC-04 Smart Scheduling

RC-04 makes temporary public state expire automatically without a GitHub commit, Vercel deployment or database cron job.

### Availability expiry

Rebecca can set a normal public availability status and optionally choose:

- **Keep this status until** — a date interpreted in `Asia/Singapore`
- **Then return to** — the status that should become effective afterwards

The `until` date is inclusive. Example:

```text
Limited availability
Until: 2026-10-18
Then: Accepting enquiries

18 Oct Singapore → still Limited
19 Oct Singapore → automatically Accepting enquiries
```

The stored Quick Control record is not rewritten by a background process. Instead, the server evaluates the schedule whenever the website, concierge or owner dashboard reads the state. That keeps scheduling deterministic and removes cron drift/failure as a dependency.

### Travel lifecycle

Travel windows can now store machine-readable `startDate` and `endDate` alongside Rebecca's public date wording.

When both dates are valid:

```text
before start date       → Upcoming
start date through end  → Current
after end date          → Past
```

Past travel remains in Rebecca Control but is automatically hidden from public travel output. Trips without both dates remain **Manual** and keep the previous behavior.

Current structured dates:
- India: 2026-11-10 → 2026-11-30
- London & Europe: 2026-12-01 → 2026-12-07

### Schedule workspace

Rebecca Control now includes **Schedule → What changes next?**

It shows:
- current Singapore date
- Current / Upcoming / Past trip counts
- upcoming automatic availability/travel transitions
- automatic transitions that have already taken effect

### Privacy and public output

Scheduling metadata such as availability fallback settings, machine travel dates and lifecycle bookkeeping is evaluated server-side and removed from the public content payload. Visitors only receive the resulting public availability and travel content.

### Storage

RC-04 reuses the existing `rebecca_control_state.payload`. No new Supabase table, function, cron, service-role key or RLS policy is required.


## Rebecca Control — RC-04B Scheduled Publishing

RC-04B adds time-based publishing to the RC-03 Media & Publish workflow while preserving explicit Draft safety.

### Owner workflow

```text
Edit / upload media
      ↓
Save Draft
      ↓
Preview Draft
      ↓
Choose Singapore publish time
      ↓
Optional expiry / revert time
      ↓
Schedule saved Draft
      ↓
Preview Scheduled snapshot
      ↓
Automatic live switch
```

### Safety model

- Scheduling captures an **immutable snapshot** of the saved media Draft.
- Later Draft edits do not silently change the scheduled version.
- A pending or active schedule blocks a conflicting manual Publish.
- Creating another schedule requires cancelling/clearing the existing schedule first.
- Cancelling a pending schedule leaves the live website unchanged.
- Cancelling an active schedule immediately returns the website to the version that was live before the schedule began.
- **Keep live permanently** converts an active scheduled snapshot into the normal published version, records the previous live state in history, removes any automatic expiry, and preserves later Draft edits.
- Scheduled preview is distinct from normal Draft preview.

### Time handling

All owner-entered schedule times are interpreted in `Asia/Singapore`.

Example:

```text
Publish: 10 Oct 2026 · 09:30 Singapore
Expiry:  10 Oct 2026 · 18:00 Singapore

Before 09:30 → previous live version
09:30–17:59 → scheduled snapshot
18:00 onward → previous live version
```

The public media endpoint evaluates the schedule when requested. Its shared cache is only 30 seconds, so a scheduled transition does not require a GitHub commit, deployment or cron job.

### Storage

RC-04B adds one protected JSON column to the existing media row:

```text
public.rebecca_media_state.schedule
```

Portable schema update:
`supabase/rc-04b-scheduled-publishing.sql`

The schedule stores:
- publish / optional expiry timestamps
- the locked scheduled media snapshot
- the previous live snapshot used for automatic revert
- previous published version reference
- creation metadata

The existing RLS + secret-header policy continues to protect the row. No service-role key is exposed and no new public write surface is introduced.


## Rebecca Control — RC-05 Visual Website Editor

RC-05 adds a private owner editing layer directly on top of the real website.

### Entry

From Rebecca Control:

```text
Edit Website ↗
```

opens the live website with `?rc_edit=1`. The editor only initializes when a valid Rebecca Control owner session exists.

### Editable structured areas

The visual editor currently supports the same structured source-of-truth fields as Quick Control:

- Availability
- Profile facts
- Singapore rate cards
- Travel cards + automatic start/end dates
- Public contact details

Clicking an editable area opens a desktop side drawer or mobile bottom sheet. Saving there writes only to the private Visual Editor Draft.

### Photo workflow

Photo regions are visually clickable too, but RC-05 intentionally does not create a second media engine.

A photo click opens the existing **Media & Publish** workspace with the matching placement already selected, preserving RC-03 / RC-04B protections:

```text
Photo click
   ↓
Media & Publish · exact placement
   ↓
Draft → Preview → Publish / Schedule
```

### Structured-content safety model

RC-05 adds:

```text
public.rebecca_control_state.visual_draft
```

The visual draft is protected by the same existing RLS + secret-header policy and is never returned by `/api/public-content`.

Workflow:

```text
Live website
    ↓
Edit Website
    ↓
Click structured content
    ↓
Save to Draft
    ↓
Real page re-renders privately
    ↓
Navigate other pages with edit mode preserved
    ↓
Publish
    ↓
payload becomes the saved visual draft
    ↓
Website + concierge update together
```

**Discard** clears the private visual draft and restores the editor preview to current live content.

A normal Quick Control **Save & apply** also clears any stored visual draft so the two editing surfaces cannot leave competing versions behind.

### Privacy

- `/api/admin/visual-editor` requires the signed owner session.
- Visual draft storage is private server-side state.
- Public content and concierge continue reading only the published Quick Control payload.
- Edit mode is not enabled just because someone adds `?rc_edit=1`; the owner session is required.
- No Supabase credentials or editor state are exposed to browser code.


## Rebecca Control — RC-06 Concierge Control

RC-06 gives Rebecca owner-friendly control over the public AI concierge without exposing prompts, model settings, retrieval internals or database details.

### Owner workflow

```text
Rebecca Control
      ↓
AI Control
      ↓
Edit presentation / Trusted Answers
      ↓
Save Draft
      ↓
Test Concierge
      ↓
Publish Concierge
```

### AI Control

Rebecca can manage:

- Concierge Live / Paused state
- public display name
- subtitle
- welcome line
- homepage introduction
- paused message
- owner-approved **Trusted Answers**
- optional internal website link for each Trusted Answer

Trusted Answers are ordinary public question/answer cards. Fixed privacy and safety guardrails execute **before** Trusted Answers, so a custom answer cannot override protected private-location, screening-data, prompt-security or rate-negotiation boundaries.

### Draft / Test / Publish

Concierge settings use a separate protected state:

```text
public.rebecca_concierge_state
```

with:

- `draft`
- `published`
- `published_version`
- `history`
- publish timestamps

**Test Concierge** always uses the saved Draft plus the current effective website data. Tests do not publish and do not enter visitor analytics.

### Public behavior

`/api/concierge-config` returns only safe presentation fields:

- enabled
- display name
- subtitle
- welcome
- default introduction
- paused message

It never returns Trusted Answers, history, owner metadata, store secrets or raw internal configuration.

The visitor concierge itself reads only the **published** Concierge Control version.

### Pause behavior

Paused mode keeps Rebecca’s Desk visible, displays the owner-approved pause message and points visitors to Contact. New AI conversations are disabled in the public UI.

### Storage security

RC-06 follows the same least-privilege pattern as other Rebecca Control stores:

- Supabase publishable key
- high-entropy `RC_STORE_SECRET`
- explicit Data API grants
- RLS
- `security_invoker = true` API view
- no service-role key in the application

Portable schema:
`supabase/rc-06-concierge-control.sql`

### Future Needs Rebecca integration

Concierge responses now include an internal `needsRebecca` signal for genuinely unresolved public questions. RC-07 can use this signal to build an owner inbox without storing visitor identity, IP address or raw session metadata.


## Rebecca Control — RC-07 Needs Rebecca

RC-07 turns genuinely unresolved public concierge questions into a small owner inbox without building a visitor CRM.

### Flow

```text
Visitor asks a public question
        ↓
Concierge uses website data + published Trusted Answers
        ↓
Answer is still genuinely unresolved
        ↓
Privacy filter
        ↓
Needs Rebecca
        ↓
Rebecca chooses Draft Answer
        ↓
AI Control opens a pre-filled Trusted Answer
        ↓
Save Draft → Test Concierge → Publish
        ↓
Matching Needs Rebecca item resolves automatically
```

### Privacy model

Needs Rebecca intentionally stores only the minimum information needed to improve the public concierge:

- sanitized public question
- broad website page where it was asked
- how many times a similar question was asked
- first / last seen timestamps
- workflow status
- answer mode that produced the unresolved result

It does **not intentionally store**:

- visitor name or account
- IP address
- email address
- phone number
- user-agent
- cookie / session identifier
- raw chat history
- screening documents
- employer documents
- financial details
- private addresses or live locations

Questions containing those kinds of sensitive values are rejected by the privacy filter before inbox storage.

### Grouping

Similar unresolved questions are fingerprinted and grouped rather than creating one row per visitor interaction.

An item can be:

- **Open**
- **Answer drafted**
- **Resolved**
- **Ignored**

If a resolved or ignored question starts appearing again, it reopens automatically and its count continues to increase.

### Owner actions

Rebecca can:

- filter Needs attention / All / Closed
- see recurring questions
- Draft Answer
- Resolve
- Ignore
- Reopen
- delete a closed item
- clear all closed items

**Draft Answer** creates a Trusted Answer Draft in RC-06 AI Control. Nothing becomes public until the normal Concierge Draft is tested and published.

### Public API boundary

The internal `needsRebecca` decision is removed before `/api/concierge` responds to a visitor. Visitors never see inbox state, capture decisions, counts or owner workflow metadata.

### Storage

Protected aggregate state:

```text
public.rebecca_needs_state
public.rebecca_needs_api
```

The store uses:

- explicit Data API grants
- RLS
- `security_invoker = true`
- the existing server-side `RC_STORE_SECRET`
- optimistic version checks for concurrent captures

Portable schema:
`supabase/rc-07-needs-rebecca.sql`

The inbox is capped to the most relevant 100 grouped questions rather than growing without bound.


## Rebecca Control — RC-09 History, Export & Recovery

RC-09 adds owner-readable history, portable backups and recovery points without exposing GitHub, Vercel or database internals.

### History

Important owner actions can create readable events such as:

- Website publish
- Concierge publish
- Media publish / schedule
- AI Admin Assistant applied to Draft
- Recovery point created
- Recovery restored to Draft

The private system ledger keeps the most recent 250 events.

### Recovery points

Before important live-changing publishes, Rebecca Control attempts to create a protected recovery snapshot containing the current Website, Concierge and Media configuration.

A rolling maximum of 10 recovery points is kept.

Restoring a recovery point always means:

```text
Recovery point
      ↓
Website Draft
Concierge Draft
Media Draft
      ↓
Rebecca reviews
      ↓
Rebecca explicitly publishes if desired
```

Recovery never changes the live website immediately.

### Export

**Export & Recovery → Download backup** produces a portable JSON document:

```text
format: rebecca-control-backup
version: 1
```

The backup includes Rebecca-managed Website, Concierge and Media configuration. The privacy-minimized **Needs Rebecca** visitor-question inbox is intentionally excluded.

### Import safety

A downloaded Rebecca Control backup can be selected in **Export & Recovery** and restored only to Draft after validation.

Import cannot:
- publish
- deploy code
- change credentials
- modify database schema
- alter GitHub or Vercel

### Storage

RC-09 adds:

`public.rebecca_system_state`

with the same existing RLS + `x-rc-control-secret` authorization model.

Portable schema:
`supabase/rc-09-history-export-recovery.sql`
