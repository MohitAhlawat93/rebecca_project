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



## Canonical Rebecca Control roadmap

These names and numbers are the canonical Rebecca Control phase registry. Do not renumber or rename a phase in later work; sub-phases such as **RC-02B** and **RC-04B** extend their parent phase.

| Phase | Canonical name | Status |
| --- | --- | --- |
| RC-01 | Foundation & Security | Implemented |
| RC-02 | Quick Control | Implemented |
| RC-02B | Persistent Quick Control Store | Implemented |
| RC-03 | Media & Publishing | Implemented |
| RC-04 | Smart Scheduling & Automatic Expiry | Implemented |
| RC-04B | Scheduled Publishing | Implemented |
| RC-05 | Visual Website Editor | Implemented |
| RC-06 | Concierge Control | Implemented |
| RC-07 | Needs Rebecca | Implemented |
| RC-08 | AI Admin Assistant | Implemented |
| RC-09 | History, Export & Recovery | Implemented |
| RC-10 | Owner Insights | Implemented |
| RC-11 | Settings & Safety Controls | Implemented |

The production website may temporarily show an earlier Rebecca Control version when newer phases have been merged to GitHub but intentionally not deployed.

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

Quick Control **Save & apply** is blocked while an unpublished Visual Editor Draft exists. The owner must first publish or discard that Draft. Normal Quick Control saves require the website version originally loaded by the browser; stale tabs receive a conflict instead of overwriting newer content. If there is no conflicting Visual Draft, Quick Control may clear an empty/equivalent draft.

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



## Rebecca Control — RC-08 AI Admin Assistant

RC-08 adds a private natural-language proposal layer on top of the existing Website Draft and Concierge Draft workflows.

### Owner workflow

```text
Rebecca describes a change
        ↓
AI Admin Assistant prepares structured proposals
        ↓
Rebecca reviews before / after
        ↓
Rebecca explicitly applies an individual proposal
        ↓
Website Draft or Concierge Draft only
        ↓
Rebecca reviews / tests
        ↓
Rebecca explicitly publishes elsewhere if desired
```

### Supported proposal areas

- Availability
- Profile
- Rates
- Travel updates and additions
- Contact
- Concierge presentation/configuration
- Trusted Answers

### Safety model

RC-08 cannot silently publish or deploy. Proposal types are server-side allowlisted, each proposal is tied to the Draft state it was generated from, and stale proposals are rejected if the underlying Draft changes before application.

Media/photo changes are intentionally excluded from direct AI manipulation and remain in **Media & Publish**.

### Model fallback

When the configured proposal model is unavailable, deterministic rules still support a small safe subset of common requests rather than giving the model publishing authority.

### Validation

Portable validation:
`scripts/validate-admin-assistant.mjs`

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


## Rebecca Control — RC-10 Owner Insights

RC-10 adds a privacy-safe operational dashboard inside Rebecca Control.

It intentionally does **not** duplicate the separate Growth/Search system. No Google Analytics, Search Console or ranking data is pulled here.

Insights are built from owner-controlled Rebecca Control state:

- privacy-filtered Needs Rebecca question groups
- recurring unresolved questions
- Website / Concierge / Media Draft status
- current Media schedule state
- upcoming Availability / Travel automatic changes
- active Trusted Answer count
- Recovery point count
- recent Rebecca Control activity

Each recommended action links Rebecca directly to the relevant Control area.

Privacy boundary: no visitor identity, IP address, user-agent, raw chat history or screening documents are included.


## Rebecca Control — RC-11 Settings & Safety Controls

RC-11 adds owner-facing preferences for optional Rebecca Control automation while preserving manual editing and explicit publishing.

### Settings

Rebecca can choose:
- which Rebecca Control section opens first after sign-in
- whether **AI Admin Assistant** is available
- whether **Needs Rebecca** captures new privacy-filtered grouped questions
- whether automatic recovery points are created before important publishes

These settings are enforced server-side, not merely hidden in the interface.

### Safety boundary

Turning optional automation off never removes manual controls.

Settings can never:
- allow silent publishing
- bypass Draft review
- expose credentials
- modify code or deployments
- alter database schema

Manual recovery points remain available even when automatic recovery is disabled.

Portable schema update:
`supabase/rc-11-settings-safety.sql`

## RC-QA-02 — Six-area Rebecca Control navigation

Rebecca Control now has **Home, Website, Photos, Concierge, Growth and Settings** as its only main navigation areas, with the original feature workflows intact.

- **Home** → Overview (operational Insights, upcoming changes and recommended actions).
- **Website** → Availability, Travel Plans, Announcements & Map, Automatic Changes, Rates, Contact Methods and Profile; the private Visual Editor remains accessible through **Edit Website**.
- **Photos** → existing Media & Publishing workspace, including its protected Draft, Preview, Publish and Scheduled Publishing logic.
- **Concierge** → AI Concierge, Test AI and Questions for Rebecca.
- **Growth** → Search Intelligence, including provider setup/sync/report imports.
- **Settings** → Account & Settings, Activity History and History & Backups.
- **Ask Control** → a header action that opens the existing RC-08 proposal-only assistant and offers a return to the previous admin section.

**Backward compatibility:** Existing `/admin?tab=availability`, `?tab=media`, `?tab=search`, `?tab=needs-rebecca` and other feature routes remain valid; owner start-tab preferences continue to be read from the stored system settings. Short links using `?tab=website` or another main area name also open that area's first section. Navigation remembers the last subtab visited in each area for the duration of the session.

The consolidation changes layout, labeling and navigation only. There is no new database schema, change in public website content, or merging of independent Website, Media and Concierge drafts.

Run `npm run validate:rc-qa-02` for navigation mappings and interaction regression checks.

## RC-QA-03 — Guidance & Owner Onboarding

Rebecca Control provides a **first-use, three-step introduction** after an authenticated session is established on a browser: updating website information, understanding Draft/Preview/Publish, and using Ask Control. The introduction is optional and may be dismissed. **Help & guide** in the owner header reopens it at any time.

Each existing feature tab has contextual, plain-language help covering:
- what the area changes;
- two or three safe, realistic actions;
- whether Save & apply changes the public site, or whether Save Draft / Test / Preview must be followed by Publish;
- a practical caution and, where relevant, a link to the public page.

Help is collapsible and remembers its state in the **owner's browser only** (localStorage keys `rc-owner-guide-seen-v1` and `rc-owner-help-collapsed-v1`). These flags contain no credentials, client messages, analytics or sensitive content. The introduction can be reopened independently of the flag. If localStorage is blocked, the interface works with a session-local fallback.

Owner-facing errors are clearer for expired logins, unavailable storage and concurrent edits: unsaved Quick Control changes remain on screen, and the guidance warns against blindly refreshing before copying them. The documentation does not grant any new publishing permissions.

This phase adds no database migrations, external analytics, new access rights or updates to public content. Run `npm run validate:rc-qa-03` for onboarding and feature guidance regression checks.

## RC-QA-04 — Publishing Center (Content & Publishing Experience)

Rebecca Control now has **Website → Publishing Center**. Home includes a shortcut, and the owner may select Publishing Center as the starting screen. This is a read-only coordination workspace, **not** a dangerous cross-store publish button.

It consolidates four owner-visible flows:
1. **Website facts** — availability, travel, notices, rates, contact and profile update publicly with the existing **Save & apply** Quick Control workflow. There is no separate draft for these direct changes.
2. **Visual Website Draft** — private, versioned structured on-page editing through **Edit Website → Save to Draft → Publish**. Quick Control refuses to overwrite a pending Visual Draft.
3. **Photos** — the existing separate private media Draft, preview and schedule/publish workflow. Upcoming or active scheduled snapshots are shown, and owner is directed to the Photos editor to manage a conflicting release.
4. **AI Concierge** — a separate saved draft with private Test AI and a deliberate Publish Concierge action.

The private `GET /api/admin/publishing-overview` endpoint reads the existing stores in parallel, returns **status only** (connectivity, saved-draft flags, versions, timestamps, schedule phase), and never returns draft payloads, messages, private visitor data or credentials. Failure of one source does not obscure the availability of the other sources. No write operations are introduced.

The workspace provides **Refresh status** after changing one of the independent editors. It does not claim that unsaved edits in another open browser tab have been saved. Draft and live states must be verified in the respective editor before publishing.

**Scope of editable text:** The existing Quick Control/Visual Editor covers structured public profile, availability, travel descriptions, notices, rates and contact text; the Concierge editor covers trusted answers and assistant presentation. This release does **not** create a free-form editorial CMS for whole homepage sections, Journal, Press, Reviews or SEO metadata. Those require a future editorial data model with authenticated draft/publish and a public rendering strategy.

Compatibility: old tab routes remain supported; the existing Supabase schema and owner authentication are unchanged. Run `npm run validate:rc-qa-04` to check routing, protected API, draft aggregation, scheduled photo lifecycle and readonly UI behavior.

## RC-QA-05 — Safe automated owner browser testing

This release adds **real headless Chromium** smoke tests in GitHub Actions at desktop (1365×850) and phone (390×844) dimensions. Unlike the existing source and DOM unit tests, these interact with the rendered admin interface, real buttons and browser confirmation dialogs.

The test harness lives in `tests/admin/` and `playwright.config.mjs`. It serves a short explicit allowlist of static admin assets locally and **intercepts every `/api/admin/*` request in memory**; unexpected requests are refused. It never logs into a deployed Rebecca Control instance, opens an actual Supabase account, uses production credentials or changes public content. The fixture ID and password (`demo-owner` / `test-only-password`) are dummy strings accepted only by that in-memory mock and are not owner credentials.

Scenarios include unauthenticated access and invalid sign-in, six-area navigation and older deep links, first-use help, Publishing Center read-only status, versioned Quick Control saves and stale/Visual-Draft conflicts, photo Draft/Publish confirmation and schedule locking, Concierge Draft/Test/Publish, recovery confirmation and logout. Both viewport projects run against the **same actual frontend scripts**, but their API responses and publication state are fake and isolated per test.

To run locally:
1. `npm install --ignore-scripts`
2. `npx playwright install chromium` (on Linux CI use `npx playwright install --with-deps chromium`)
3. `npm run test:admin:browser` (or `npm run test:admin:browser:desktop` / `npm run test:admin:browser:phone`)

GitHub Actions now requires the full `npm run validate`, both browser test projects, and `npm run vercel-build` to pass before merge. Failure traces and screenshots are stored only in the local/CI workspace unless explicitly shared; no real private content is used. The test server is restricted to `127.0.0.1` and a set of allowlisted admin files.

**Not covered by simulated browser tests:** production owner credentials, actual Supabase connectivity/RLS policy, real email/integration provider connections, Vercel-authenticated owner login, physical device quirks, and real recovery against owner content. Those remain for RC-QA-06/07 and a supervised owner acceptance session; avoid entering production passwords into automated tests.

## RC-QA-06 — Security, Recovery & Owner Handoff

**Owner-friendly instructions:** [Rebecca Owner Handbook](docs/REBECCA_OWNER_HANDBOOK.md).  
**Technical runbook and open risks:** [Security & Infrastructure Handoff](docs/RC-QA-06-SECURITY-HANDOFF.md).

Security improvements:
- Owner session signatures now bind to the private password hash as well as the private session secret. Rotating either invalidates previously issued cookies after the new deployment; existing owners must sign in again after the RC-QA-06 release.
- Central owner API routing rejects explicit cross-origin browser writes and cross-site Fetch Metadata requests, with an isolated exception for Vercel Blob's signed upload callback. Owner session auth and SameSite=Strict remain required; missing Origin values are accepted for server compatibility.
- Malformed cookies and oversized session tokens are handled without crashing API routes.
- Backup imports reject unsupported formats, oversized content and incomplete Website/Photos/Concierge records on the server before writing.
- Recovery creates a protective recovery point **before** changing any Draft. Independent stores are not an atomic transaction, and the owner receives a clear partial-restore error rather than a false success message.

**Verification:** `npm run validate:rc-qa-06` runs isolated security and backup checks in CI; browser tests still run at desktop and phone widths. No real owner passwords, production content, domain DNS or database credentials are modified in this release.

**Handoff is incomplete** until Rebecca's own Vercel/Supabase/Blob/provider accounts, MFA, distributed login-rate protection, physical-device signoff and supervised production recovery are verified. The runbook explicitly distinguishes software guards from production authorization and external penetration testing.

## RC-QA-07 — Final Owner Acceptance & Launch Signoff

**Current decision: NOT SIGNED OFF. Domain and indexing changes remain outside this phase.**

Rebecca Control now includes **Settings → Launch Readiness** (deep link `/admin?tab=launch`). The owner-only `GET /api/admin/launch-readiness` route summarizes read-only Website/Photos/Concierge and recovery-store connections, recovery-point counts and AI key configuration presence. This is **not** a claim that real production editing, RLS policies, Groq quality, backup restoration or legal requirements have been verified. It returns no credentials, private content or stored customer data.

The screen separates automated statuses from seven **ephemeral** owner review boxes and allows copying a plain-text review worksheet. Checkmarks are not saved or treated as consent; there are no publish, DNS, deployment, signoff or indexing actions. Refreshing the dashboard cannot approve a launch. Run `npm run validate:rc-qa-07` to test status summaries and safety boundaries; headless Chromium tests cover desktop and phone interaction.

**Observed staging baseline:** homepage and admin both served HTTP 200; a sitemap exists; homepage noindex and `Disallow: /` remain deliberately in force; recent runtime records include historical Groq fallback 413/429 errors. No custom-domain launch was performed in this phase.

**Signoff runbook:** [RC-QA-07 Launch Acceptance](docs/RC-QA-07-LAUNCH-ACCEPTANCE.md). Review with Rebecca, record a dated decision/evidence and only then begin a **separately authorized domain/indexing release**. The [Owner Handbook](docs/REBECCA_OWNER_HANDBOOK.md) and [Security Handoff](docs/RC-QA-06-SECURITY-HANDOFF.md) remain companion documents. Each future client/country needs its own independent evidence and permission.
