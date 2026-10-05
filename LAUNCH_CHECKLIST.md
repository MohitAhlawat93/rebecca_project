# Production Launch Checklist

The review build currently uses `rebeccaproject.vercel.app`. Rebecca’s existing `www.risquerebecca.com` site remains the public content and factual source of truth until domain cutover.

## Completed before cutover

- Responsive desktop, tablet and mobile QA completed.
- Core navigation and enquiry routes audited.
- Concierge stress-tested for rates, travel, screening, deposits, cancellations, couples, calls, availability, private information, prompt injection, discounts and unpublished services.
- Public facts rechecked against Rebecca’s live site.
- Legacy redirects prepared for:
  - `/singapore-rates` → `/rates`
  - `/touring-rates` → `/travel`
  - `/wishlist` → `/date-ideas`
  - `/links-grouped` → `/contact`
- Legacy gallery URLs `/professional` and `/selfies-of-risquerebecca` are preserved as real pages rather than redirected.
- Security headers and concierge request handling hardened.
- Sitemap, robots and homepage structured data are present.

## Before switching the real domain

1. Rebecca gives final visual approval on desktop and mobile.
2. Replace any photography Rebecca wants changed for the production version.
3. Reconfirm current rates, travel calendar/minimums, screening, deposits and cancellation policies against the live source.
4. Recover the original public video asset used on Rebecca’s current Selfies page and place it in the reserved moving-image position. The current crawler exposes the video’s existence but not the underlying media URL.
5. Recover/migrate the existing Blog (`/musings`) and Media Appearances (`/media-appearances`) source content before domain cutover. Do not redirect those URLs to unrelated pages.
6. Add `XAI_API_KEY` to the canonical Vercel project and optionally set `XAI_MODEL` (default: `grok-4.3`).
7. Test WhatsApp, Telegram, email, enquiry copy/open actions and the concierge in real iPhone/Android/desktop browsers.
8. Connect `www.risquerebecca.com` to the canonical Vercel project.

## At domain cutover

1. Replace `https://rebeccaproject.vercel.app` with `https://www.risquerebecca.com` in:
   - page canonical URLs
   - Open Graph URLs
   - `sitemap.xml`
   - homepage structured data
   - `robots.txt` sitemap reference
2. Keep public crawling enabled and confirm `robots.txt` points to the production sitemap.
3. Keep the prepared permanent legacy redirects active.
4. Verify HTTPS and choose one canonical host; redirect the other www/non-www form permanently.
5. Verify all legacy URLs return the intended permanent redirect.
6. Submit the production sitemap in Google Search Console.
7. Run final browser, accessibility and performance checks on the production domain.

## Do not do before cutover

- Do not change canonical URLs to `www.risquerebecca.com` while the old site is still serving different pages there.
- Do not remove or redirect Blog/Media URLs until their migration plan is decided.
- Do not invent missing rates, services, availability or private information to fill launch gaps.
