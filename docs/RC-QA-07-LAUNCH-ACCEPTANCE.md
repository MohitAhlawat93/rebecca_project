# RC-QA-07 — Final Owner Acceptance & Launch Signoff

**Status: NOT SIGNED OFF — demo/staging only. DO NOT SWITCH DOMAIN, REMOVE NOINDEX, OR PUBLICLY PROMOTE UNTIL OWNER ACCEPTANCE.**

**Review prepared:** October 8, 2026 (India time)  
**Environment under review:** `https://rebeccaproject.vercel.app` and `/admin`  
**Deployment baseline at review:** `d65f48f946bf1d0b34739694dc7c6d8c3c139a50` (RC-QA-06)  
**Scope:** Launch evidence, owner walkthrough, blocking issues and rollback procedure. This is a release gate, **not an authorization** to migrate Rebecca's existing website or point a domain.

## 1. Verified public evidence

| Check | Evidence observed | Status |
| --- | --- | --- |
| Vercel baseline | Latest RC-QA-06 production deployment READY | Automated pass at time of review |
| Public homepage | `GET /` → HTTP 200, prerendered markup present | Automated pass |
| Private admin page | `GET /admin` → HTTP 200, login markup present | Public page delivery only; not an authenticated login test |
| Structured public content | `GET /api/public-content` → HTTP 200 | Automated pass; data correctness needs Rebecca |
| Public sitemap | `GET /sitemap.xml` → HTTP 200 | Automated pass; canonical targets need owner approval |
| Staging crawl policy | Homepage includes `noindex`; `robots.txt` contains `Disallow: /` | **Expected staging protection; must be consciously changed on domain launch** |
| Homepage canonical | Staging `https://rebeccaproject.vercel.app/` | Expected on staging; custom domain canonical **not yet validated** |
| Runtime stability | 24-hour runtime query returned historical Groq fallback 413/429 errors on October 7; associated with an earlier deployment | **Needs targeted live AI/fallback and limits check** |
| User flows | Existing RC-QA-05 suites previously passed 22 desktop/phone browser tests using isolated fake admin data | Automated fixture coverage only; not real owner or device signoff |
| Owner runtime controls | Launch Readiness endpoint checks existence/connection health of content and recovery stores for signed-in owners | Read-only signal, not proof of successful real restore |

## 2. Release blockers — must have evidence before APPROVED

1. **Owner access/rights:** Rebecca demonstrates real password sign-in/sign-out on mobile and laptop; confirms recovery contact, domain ownership, Vercel/GitHub/Supabase and billing access. **Not verified.**
2. **Content accuracy:** Rebecca approves text, hero and gallery images, dates, rates, policies, contact routes, multilingual copy and changes that affect enquiries. **Not verified.**
3. **Publishing behavior:** Confirm Website Save & apply, Visual Draft/Preview/Publish, Photos scheduling, and Concierge Draft/Test/Publish against the authorized real owner environment. Use reversible harmless content; restore original content. **Not verified.**
4. **Recovery:** Owner-approved manual backup export, protective recovery point and supervised restore **to Draft only** in a controlled environment. Confirm no active saved Draft is overwritten by accident. **Not verified.**
5. **Data privacy/security:** Verify actual Supabase RLS and restricted views, secrets, login controls, MFA on provider accounts, appropriate distributed throttling/alerts, backup access permissions and privacy/legal notices. **Not verified.**
6. **AI quality and availability:** Test representative questions (FAQ/rates/travel, unknown facts, unrelated harmless questions, multilingual queries), refusal/fallback policy, mobile widget behavior and provider quota failures 413/429. Do not assume Groq API health from the website returning 200. **Not verified.**
7. **Search/domain:** Confirm final hostname and owner consent, domain verification, 301 redirect strategy, unique canonical URL, indexability, sitemap URLs, search property ownership, localization/hreflang, indexing toggle and monitor. Staging remains noindexed until the explicit domain-switch release. **Not verified.**
8. **Physical device usability:** Actual iOS/Android and laptop browser acceptance, fixed/minimized concierge behavior, scroll, tap targets, images, safe-area and network/refresh behavior. Browser fixture simulations are not a substitute. **Not verified.**

**Decision rule:** All 8 owner/technical approval groups must have dated evidence and an identified reviewer, no critical unresolved incident, and signed approval from Rebecca *before* the production domain/indexing migration. A PR merge or a green Vercel deployment cannot override that decision.

## 3. How Rebecca completes acceptance

1. Open [Rebecca Control](https://rebeccaproject.vercel.app/admin) and sign in privately.
2. Open **Settings → Launch Readiness**; click **Check again**. The server status is read-only and deliberately always says **NOT SIGNED OFF** until a separate approval process is completed.
3. Go through the **seven owner walkthrough checkboxes** together with a technical administrator; each must be independently tested, not assumed. They reset on refresh and are not stored as consent or proof.
4. Click **Copy review notes** and attach them to a dated acceptance record with screenshots/links that contain **no credentials or private customer information**.
5. Complete section 4 below. Obtain owner approval and keep it with the handoff documents. Only after that is a **separate domain and search-release change** authorized.

## 4. Owner signoff record (complete outside the website)

- Owner / authorized approver: __________________
- Technical reviewer: __________________
- Date/time & timezone: __________________
- Final target domain: __________________
- Last tested deployment SHA and URL: __________________
- Backup identifier & stored location (NOT contents): __________________
- Evidence links for each of the 8 blocker groups: __________________
- Unresolved issues / accepted residual risks: __________________
- Business/legal/privacy approval: __________________
- Owner explicitly authorizes custom-domain and indexing switch? **YES / NO**
- Owner signature / dated approval: __________________
- Technical signoff: __________________

If any field is missing, mark **NOT SIGNED OFF**. Never store passwords, session tokens, full backup contents, screening documents or API keys in the acceptance record.

## 5. After owner approval — separate controlled launch

**DO NOT SWITCH DOMAIN during RC-QA-07.** When the separate launch authorization exists:

1. Preserve a known-good Vercel deployment and secure backup/export; record database state and owners.
2. Verify DNS, domain registrar access, SSL/TLS issuance, Vercel domains and target redirects without changing live DNS prematurely.
3. Adjust `SITE_ORIGIN`, `PRODUCTION_SITE_ORIGIN`, `SITE_MODE`/`INDEXING_ENABLED` only according to the approved environment plan; build and review prerendered canonicals, robots, XML/image sitemaps and localization output. Avoid editing canonical markup by hand.
4. Publish and verify the approved domain. Ensure all expected public pages are reachable and that the **admin remains noindex and authenticated**.
5. Revalidate Search Console/Bing Webmaster properties, request indexing where appropriate, and monitor indexing, traffic, errors, concierge fallback and conversions.
6. If the code release causes an outage, use a reviewed Vercel deployment rollback; **the database does not roll back automatically**. Restore database content separately only when needed and under owner approval.
7. If owner acceptance is revoked or privacy/content is incorrect, stop the release, restore previous safe serving state and reassess legal/operational impact.

## 6. Who does what

**Rebecca:** Owns facts, images and rights, accepts the visual experience and on-site copy, controls operational content, approves release and validates real editing workflows.

**Technical administrator:** Verifies secrets, Supabase RLS, Blob storage, Vercel/GitHub/domain access, provider accounts, backup handling, live runtime behavior, search properties, security monitoring and incident playbook.

**Automated checks:** Guard code, server status summaries, browser fixture flows and Vercel build quality. They **cannot sign on behalf of Rebecca**.

## 7. Project portability

For the next client or country, reuse the launch gate **without copying Rebecca's account identities, media, prices, private data, domain or confirmations**. Give each client an independent repository/deployment environment and private secrets, tailor the approved locale/SEO configuration, and repeat the owner signoff. The checklist is a reusable process, not evidence transferable between clients.

**Follow-up:** [Owner Handbook](REBECCA_OWNER_HANDBOOK.md) · [Security Handoff](RC-QA-06-SECURITY-HANDOFF.md)
