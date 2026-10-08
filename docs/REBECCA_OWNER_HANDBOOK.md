# Rebecca Control — Owner Handbook

**Private owner URL:** https://rebeccaproject.vercel.app/admin  
**Public demo URL:** https://rebeccaproject.vercel.app/  
**Audience:** Rebecca (website owner). This guide contains **no** passwords, reset links, recovery codes or private client details.

## 1. Your everyday routine (no developer required)

1. Sign in at the private owner URL on your own phone or computer. Bookmark it; do not share the password.
2. Start on **Home** or **Website → Publishing Center**. Use **Help & guide** to reopen the introduction.
3. To update availability, dates, rates, contact routes, basic profile facts or announcements, use **Website** and click **Save & apply**. These changes become public after a successful save.
4. To make supported changes while viewing a page, choose **Edit Website**. Save to a *private Website Draft*, review it, then publish in the Visual Editor.
5. For photos, use **Photos → Photos & Publishing**: select, save Draft, preview mobile/desktop crops, and **Publish** or schedule the approved version.
6. For the assistant, use **Concierge → AI Concierge**: save Draft, **Test AI** with different questions, then **Publish Concierge** if accurate. Its live availability can only reflect the published source data, not unconnected live booking calendars.
7. After a major change, open **Publishing Center → Refresh status** and inspect the public website in a new tab. A Draft is not public.

**Important:** If Website says there is a pending Visual Draft, finish or discard that private Draft before using **Save & apply** on the same structured data. This is deliberate protection against overwriting your work.

## 2. Where to change what

| I want to… | Open |
| --- | --- |
| Update the public status or expiry | Website → Availability |
| Announce an upcoming city or tour | Website → Travel Plans |
| Put a small top-bar notice on the website | Website → Announcements & Map |
| Change public rates or contact information | Website → Rates / Contact Methods |
| Edit basic biography facts and languages | Website → Profile |
| Change approved photos | Photos → Photos & Publishing |
| Change AI greeting and trusted answers | Concierge → AI Concierge |
| Check how an AI answer would sound | Concierge → Test AI |
| Answer recurrent public questions | Concierge → Questions for Rebecca |
| Understand search visibility and connections | Growth → Search & Growth |
| Change startup screen and owner preferences | Settings → Account & Settings |
| View what changed | Settings → Activity History |
| Export or restore privately | Settings → History & Backups |
| Have a change proposed for review | Header → Ask Control |

**Not yet self-service:** every long-form homepage section, Journal/Press article, Reviews content, SEO title templates, infrastructure credentials and new database schemas. Ask the website administrator about changes outside the available editor rather than assuming all pages are editable.

## 3. Preview, Draft and Publish — three different actions

- **Save & apply** (Website Quick Control) immediately updates structured public content. Double-check dates, currency, links and phrasing before clicking it.
- **Save Draft** saves a *private* copy for Visual Website, Photos or AI Concierge. Visitors still see the previous published version.
- **Preview/Test** lets you inspect the Draft, not publish it.
- **Publish** changes just that area. Publishing Center never has a one-click “publish everything” function.
- **Scheduled Photos** can publish at a Singapore time. Check expiry and revert behavior before setting it; manual photo publish is blocked while a conflicting schedule is active.
- **Backup restore** only restores copies to Draft; it never automatically publishes.

## 4. Backups and accidental changes

**Before a major change:** Go to **Settings → History & Backups**. Download a current backup to an access-controlled device, then create a recovery point in **Activity History**. Backups may contain public contact links and unpublished texts; do not share them in public chats or upload them to unknown services.

**If something is wrong with a published page:**

1. Verify exactly which editor controls it (Website, Visual Editor, Photos or Concierge).
2. Stop making other changes and save a current backup while the database is reachable.
3. Open **History & Backups**, select a known-good recovery point or carefully chosen JSON backup.
4. Confirm restoration **to Draft**. The system creates a protective pre-restore recovery point first.
5. Review each of **Website Draft**, **Photos Draft** and **AI Concierge Draft** before publishing any of them. Restoring changes three separate stores; if one store fails, the system will report a partial restore. Do not publish until all three are reviewed or repaired.
6. Publish only the sections you intend to replace and check the public site.

**Lost password:** There is deliberately no public password-reset button. Ask the person who securely manages the Vercel environment to rotate the owner password hash and invalidate old sessions. Never send the current or new password in chat/email, or store it in the repository.

**Lost device or suspected account compromise:** Inform the technical administrator immediately to rotate **both** `RC_ADMIN_PASSWORD_HASH` and `RC_SESSION_SECRET` in Vercel Production, redeploy, and review activity. Password-hash rotation now invalidates all previously issued owner sessions on the new deployment. An ordinary logout clears the local browser cookie but is not a global session-revocation mechanism.

## 5. Good security habits

- Use a unique, strong owner password and a password manager; enable MFA on the **Vercel, GitHub, Supabase, domain registrar and Google** accounts themselves.
- Use only the private HTTPS admin URL. Do not share a signed-in browser, export files or screenshots containing owner data.
- Store public facts and approved answers only; never put client identity, passwords, documents, private hotel information or screening details in public fields.
- Keep the production domain under the owner’s control and restrict deployment privileges.
- The dashboard’s brief login throttling is not a distributed brute-force defense; platform WAF/rate limits and monitoring must also be configured.
- If a save says **conflict**, do not blindly refresh and lose your text. Copy unsaved edits first, review the latest Draft/live state, and reapply carefully.
- A technical code rollback and a content Draft restore are **different** operations. A Vercel deployment rollback does not roll back database content.

## 6. Hand-off checklist for Rebecca and her technical administrator

The application is currently using an interim infrastructure arrangement. Do **not** switch ownership, database keys or the custom domain without first copying state and verifying a safe preview.

- [ ] Rebecca controls the domain registrar, its renewal and DNS.
- [ ] Rebecca or her designated administrator has the correct Vercel Team/project access and GitHub repository permissions.
- [ ] Rebecca has her own Supabase project and the tested Rebecca Control schemas/RLS policies are applied to it; existing content, drafts, media data and recovery settings are copied and verified before switching environment variables.
- [ ] Server-side secrets are **new, unique** per client: `RC_ADMIN_LOGIN_ID`, `RC_ADMIN_PASSWORD_HASH`, `RC_SESSION_SECRET`, `RC_SUPABASE_URL`, `RC_SUPABASE_PUBLISHABLE_KEY`, `RC_STORE_SECRET`. The session secret must be at least 32 characters. Do not paste values into this document.
- [ ] Vercel Blob assets and `BLOB_READ_WRITE_TOKEN` remain accessible, or media files are migrated and tested before the old project is removed.
- [ ] AI provider keys and search/OAuth accounts (where connected) are rotated/reconnected for Rebecca and confirmed to work, with usage limits and billing checked.
- [ ] Google Search Console/Bing Webmaster property ownership and OAuth redirect domain, analytics and legal/privacy notices are checked.
- [ ] The real owner can sign in, update a harmless **test-only** public fact and verify it, then restore the original fact.
- [ ] A backup **download** and a supervised **Draft-only** restore have been tested with owner approval; previous draft state documented.
- [ ] Rebecca confirms her preferred publishing and recovery flow on an actual phone and laptop.
- [ ] The final custom-domain switch, canonical/sitemap change and removal of any launch noindex restrictions are agreed and checked separately.

**Handoff is not final while the actual owner login, production storage/RLS validation, physical-device acceptance and domain switch are unverified.**

## 7. If something stops working

| Symptom | First step |
| --- | --- |
| Cannot sign in | Confirm correct owner URL and ID; check account lockout, then ask administrator to verify Vercel configuration. Do not keep guessing passwords. |
| Save is disabled | Check for an unpublished Visual Website Draft, missing storage connection or a stale content version. |
| Photos not showing | Confirm saved photo placements and published version; check Vercel Blob references and the browser console with your administrator. |
| AI answers are old | Make sure you published the Concierge Draft and current Website facts; Test AI uses Draft and may differ from live. |
| Admin shows fallback/unavailable | Do not edit/publish. Ask administrator to check Vercel Function logs, Supabase project permissions and database connectivity. |
| Lost content | Use History & Backups to restore to Draft; verify before publishing. |
| Website down after code release | Ask administrator to inspect the latest deployment and perform a reviewed Vercel rollback if needed; remember database content is independent. |

## 8. Ready-to-sign owner acceptance

Date: ________  Owner: ________  Technical administrator: ________

- [ ] Access, editing, Draft, preview and publishing demonstrated
- [ ] Photos and AI draft workflows demonstrated
- [ ] Local backup exported and safely stored
- [ ] Protected recovery point created; safe recovery procedure understood
- [ ] Billing/ownership, incident contact and MFA verified
- [ ] Final list of pending scope and limits accepted

Signature / approval: __________________
