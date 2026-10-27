# InternBoard — Quality Evidence

**Run date:** 2026-10-27  
**Runtime:** Node.js 24.13.1  
**Scope:** Backend API and SQLite integration, frontend tests, lint, production build, responsive navigation, and basic accessibility checks.

## Automated regression checks

Run from the project root with `npm run check`.

| Check | Result |
|---|---|
| Backend HTTP/SQLite integration tests | 9 passed, 0 failed |
| Frontend component, hook, and validation tests | 10 passed, 0 failed |
| Frontend ESLint | Passed |
| Vite production build | Passed |

Coverage includes account registration/login/logout, listing search and parameter binding, application validation and persistence, unauthenticated access, malformed and oversized JSON, security headers, CORS allowlisting, rate limiting, database readiness, and request-log query-string redaction.

## Responsive and accessibility spot checks

Manual browser checks were run against the primary home, browse, about, how-it-works, and contact pages at 320, 390, 768, and 1024 CSS-pixel viewport widths.

- No horizontal document overflow at the tested widths.
- The mobile menu appears at widths up to 900px, opens/closes with the button, closes with Escape, and returns focus to the toggle.
- Each checked page exposed one main landmark, and every rendered image had an `alt` attribute.
- The application has a skip link, visible keyboard focus styles, labeled form controls, status announcements, and reduced-motion handling.

These are focused manual checks, not a formal WCAG conformance audit. Automated axe/Lighthouse scores and real-device testing have not been run.

## Performance smoke check

The primary homepage was loaded from the local production server at a 390px browser viewport. One browser sample reported **254 ms DOMContentLoaded**, **254 ms load**, and **28.6 KB transferred across 10 resources**. This local result is only a smoke measurement, not a network-representative benchmark or Lighthouse score.

The production React bundle is approximately **336 KB raw / 108 KB gzip**, and its CSS approximately **21 KB raw / 5 KB gzip**. Resized/compressed static artwork is about **25–73 KB per image**; below-the-fold guide illustrations use lazy loading. The previous student illustration was 227 KB and is now 25 KB; the 1.1 MB favicon is now 29 KB.

Formal Lighthouse/PageSpeed scores, throttled-network tests, and real-device measurements have not been run.

## Operational smoke check

The local API readiness endpoint returned HTTP 200 with `{"status":"ok","checks":{"database":"ok"}}`. Listing retrieval returned HTTP 200. Request logs include a correlation ID, method, path, status, and duration; query strings and request payloads are intentionally excluded.

Node prints an experimental-feature warning for the built-in `node:sqlite` API. Tests use an in-memory database; the local development database is ignored by Git. No live deployment or public walkthrough URL is available yet; see the root README for publishing steps.
