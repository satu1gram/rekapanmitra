# QA Artifacts

This directory contains screenshots and manual verification artifacts that are useful for release review but are not runtime application assets.

## Frontend Screenshot Review

- Capture date: 2026-09-11
- Viewport: 1440 x 1000
- Runner: Playwright with Chromium
- Route coverage: login, register, forgot password, reset password, AI advisor, public store, authenticated app routes, admin routes, and not-found.

Protected routes were captured without an authenticated session, so their screenshots document the current redirect or access-denied state rather than an authenticated user view.

Known observations:

- The demo public store slug is not active and shows the store-not-found state.
- The AI advisor uses separate Quantum Millionaire branding and layout from the main Rekapan Mitra app; this should be reviewed as an intentional product boundary.
