# Production Launch Checklist

The Vercel review site is intentionally protected from indexing while the existing https://www.risquerebecca.com remains live.

## Before switching the real domain

1. Rebecca visually approves desktop and mobile pages.
2. Replace any photography Rebecca wants changed.
3. Reconfirm rates, travel minimums, screening, deposit and cancellation policies.
4. Test the AI concierge with at least:
   - rates
   - travel
   - screening
   - live availability
   - unknown/private information
   - prompt-injection attempts
5. Test the contact flow on iPhone/Android and desktop:
   - WhatsApp
   - email
   - copy enquiry
6. Connect the production domain to the canonical Vercel project: `rebecca_project`.

## At domain cutover

1. Remove the global `X-Robots-Tag: noindex, nofollow, noarchive` header from `vercel.json`.
2. Change `robots.txt` from `Disallow: /` to allow public crawling.
3. Replace temporary `rebeccaproject.vercel.app` URLs in:
   - `sitemap.xml`
   - structured data
   - canonical/OG URLs as added
   with `https://www.risquerebecca.com`.
4. Verify HTTPS and both www/non-www redirects.
5. Re-submit the sitemap in Google Search Console.
6. Run final browser, mobile, accessibility and performance checks.

## Do not do before cutover

Do not remove the noindex protection while the old Rebecca site is still live with overlapping content. That could create duplicate-content/indexing confusion.
