# RC-QA-06 — Security, Recovery & Infrastructure Handoff

**Scope:** Code hardening, a safe restore model, automated checks and owner documentation.  
**Not in scope:** reading or changing live credentials, copying production data, rotating current secrets, granting account permissions, changing DNS, or executing live restores.

## Security controls reviewed

| Area | Current safeguard / limitation | Owner/administrator action |
| --- | --- | --- |
| Admin login | Server-side scrypt password verification, signed HttpOnly session, SameSite=Strict, Secure cookie on Vercel, max 12-hour lifetime | Use a unique password; control Vercel account and enable its MFA |
| Session revocation | Token signing now binds to the current password hash; rotating `RC_ADMIN_PASSWORD_HASH` or `RC_SESSION_SECRET` invalidates previously signed tokens after redeployment | Rotate both after compromise, verify fresh login; users will have to sign in again after this rollout |
| Admin write CSRF | Central guard rejects explicit foreign Origins or `Sec-Fetch-Site: cross-site` on browser mutating API requests; owner cookie SameSite Strict | Confirm custom-domain host and trusted Vercel callback behavior in production |
| Vercel Blob upload | Authorized separately by its signed upload callback; generic origin guard excludes its endpoint so trusted server callback traffic is not blocked | Test real owner upload; verify bucket token scopes and published media URLs |
| Login rate limiting | In-memory per-process 5 attempts / 15 min, **not reliable distributed rate limiting** | Enable platform/WAF rate limiting and alerts before sensitive production handoff |
| MFA | Owner app itself has no second factor | Keep platform accounts protected by MFA; consider owner app MFA in a future scoped release |
| Data storage | Publishable Supabase key + server-only `RC_STORE_SECRET`, private RLS / security-invoker API views, optimistic versioning | Reinspect actual RLS policies/grants for new owner project and verify public API cannot list private rows |
| Backup import | 8 MB client/server max, version/schema checks; no code/schema deployment via import | Treat backups as sensitive, verify source and inspect all Drafts after import |
| Restore | Protective recovery point required **before** modifying separate Website, Concierge and Photos Drafts; fail visibly if only some succeed | Review every Draft and the pre-restore point before retrying; restoration is not atomic |
| Search integrations | Server-held OAuth secrets/tokens, public return navigation | Verify and reconnect the new owner's Google/Bing credentials; rotate client secrets when transferring |
| Source & CI | Full Node validation and 22 simulated browser tests on PRs | Enable protected main branch and require checks/reviews before production merge |
| Public content | Canonical data fallback, explicit publishing and separate Drafts | Confirm fallback is not treated as proof of current live data |

**Browser write guard limitations:** A missing `Origin` and missing Fetch Metadata are accepted for non-browser compatibility; this is defense in depth rather than a replacement for session auth, SameSite cookies, rate limits, CSRF-focused penetration testing or trusted-host validation at the edge. Vercel Blob callback handling remains isolated. No claim is made that full external security penetration testing was performed.

## Credentials, domains and ownership

The operational handoff must be performed by an authorized account owner/technical administrator in their own provider consoles. Do not request or paste production secrets into chat, commit history, screenshots, CI output or client-facing guides.

**Vercel / domain:** Confirm the production project and new domain, environment scopes (Production, Preview, Development), team owner permissions, custom domain, DNS and billing. Enable team MFA and deploy protection as appropriate. Never switch the domain before RC-QA-07 acceptance.

**Private owner authentication:** Configure `RC_ADMIN_LOGIN_ID`, `RC_ADMIN_PASSWORD_HASH` (application-supported scrypt format), `RC_SESSION_SECRET` (high-entropy, at least 32 characters). To revoke all current sessions, rotate password hash or session secret in Production and deploy. There is **no global logout endpoint** or self-service password recovery UI. Replacing the password hash invalidates active sessions by design. Record the password only in the owner's password manager, not in the handoff notes.

**Database:** The current project previously used an interim Supabase account. Create an owner-controlled Supabase project, apply the existing schema files with least-privilege RLS, migrate current Website/Media/Concierge/System state and validate drafts/live versions **before** changing `RC_SUPABASE_URL`, `RC_SUPABASE_PUBLISHABLE_KEY`, `RC_STORE_SECRET`. Restore should never be used as a shortcut to change database connection secrets. Check security-invoker views, grants, row-level policies and access without the control header; inspect an actual queried row on the new database in a controlled acceptance test.

**Photos:** Confirm Vercel Blob project ownership, `BLOB_READ_WRITE_TOKEN`, image URLs, and appropriate upload MIME/size restrictions. If moving to a different Blob bucket, migrate public images and saved placements together.

**AI/search:** Check the correct provider/API keys, usage ceilings, rate controls, `SEARCH_OAUTH_REDIRECT_ORIGIN`, `SEARCH_OAUTH_STATE_SECRET`, Google/Bing client secrets and property ownership, plus analytics accounts. Verify redirects and credentials without logging access tokens. Service provider identities and accounts should be owner-controlled.

## Backup and emergency response

### Safe recovery practice (requires owner consent)

1. Export the existing state as an encrypted-at-rest or access-restricted JSON backup (encrypted storage is the owner's responsibility).
2. Confirm storage health and that no other editor is actively being used.
3. Pick a known-good history version or backup, inspect metadata and approve restore.
4. A new recovery point of **current** content is written before any Draft is modified. If this cannot be saved, restore stops.
5. Restore Website, Concierge and Photos in sequence, **to Draft only**.
6. If any step fails, treat state as potentially **partial**. Preserve the pre-restore snapshot, inspect all three Drafts, then retry or use controlled manual recovery. No live publishing is automatic.
7. Preview Website and Photos; test AI answers; publish only individual approved sections.

### If the app or account is compromised

- Halt owner publishing and restrict access at Vercel/team level.
- Rotate owner password hash and session secret; redeploy and verify old cookies fail.
- Rotate affected Supabase control secret, Blob token, AI/OAuth provider credentials **only after** planning safe provider-specific transitions.
- Inspect Vercel Function logs, GitHub PR/commit history, account audit trails, Search Console and owner activity. Do not rely on the dashboard event log alone for forensic investigation.
- Verify available recovery snapshots and export them securely before any overwrites.
- Restore from a trusted source and complete supervised acceptance tests.
- For a code-level regression, use a reviewed Vercel deployment rollback; separately inspect database state.

## Handoff acceptance & unresolved checks

| Check | State at RC-QA-06 code release |
| --- | --- |
| Server-side session rotation and origin-defense tests | Automated locally/CI |
| Backup schema and size validation | Automated locally/CI |
| Existing desktop + phone mocked browser flows | CI |
| New owner real login and logout | **Not performed** |
| New Supabase RLS and permissions verification | **Not performed** |
| Real restore/partial restore and Blob upload | **Not performed** |
| WAF/distributed login throttle and monitoring | **To configure** |
| Provider secret/role ownership transfer | **Not performed** |
| Physical mobile/desktop owner signoff | **Not performed** |
| Custom domain switch | **Not performed** |

**RC-QA-07 should not be signed off** until the unverified production checks have been completed and documented. See [Rebecca Owner Handbook](REBECCA_OWNER_HANDBOOK.md) for the nontechnical steps.
