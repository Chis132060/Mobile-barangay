# PWA offline audit and first implementation (October 2026)

Reference: https://www.gomage.com/blog/pwa-offline/

## Current behavior

- **Supported:** Production Expo web static app shell and public JS/CSS/font/image assets can be cached after successful online visits and then reused offline. The service worker is only registered on production HTTPS/localhost. Install and first online load are required.
- **Supported:** Bundled offline Ate Sora knowledge/FAQ. Native on-device LLM is a different runtime and is not supported by browsers through this module.
- **Not supported:** Offline live Supabase data, status changes, new document submissions, QR payment proof, account verification, new uploads, and notification delivery. Never claim those are synchronized when offline.
- **Security policy:** Service worker ignores cross-origin requests, auth headers, mutations, server APIs, Supabase endpoints, storage paths and requests with query parameters. It never globally caches authenticated responses or resident records.
- **Browser storage:** Static Cache API only at this stage. No IndexedDB queue for sensitive form submissions yet, because the app must authenticate the current resident, prevent duplicate submissions, confirm server transaction IDs, resolve conflicts, and make retries explicit.
- **Future stage (requires review):** resident-owned, encrypted-on-device offline draft form fields; consent, clear data, account-scoped storage, upload metadata without binary persistence, safe manual sync when online and no automatic payments; clearly labeled last-known status with timestamp.

## Acceptance test on the deployed PWA

1. Deploy the **Expo web production export** to HTTPS with `sw.js` served at the root. Open online once and wait for service worker installation; visit home, chat and requests to populate public static asset cache.
2. Chrome DevTools > Application > Service Workers: verify registered; Application > Cache Storage: verify only `barangay-pwa-public-v1-*` public caches.
3. DevTools > Network > Offline; refresh a route. The cached app shell should load if previously downloaded assets are present.
4. With no network, ask an FAQ: local JSON fallback should answer. Request lists, payment verification, documents and server submissions must explicitly fail or show offline state, *not* fake success.
5. Reconnect and refresh to get official live data. Sign out and verify that a different resident cannot see stale requests from a previous account.
6. Test fresh offline installation (expected not to work without initial online visit), static asset eviction, SW updates, Safari PWA behavior, browser storage cleanup and HTTPS hosting.

## Android CI issue

PR run #65 failed on Android manifest merger: `expo-ai-kit` requires minSdk 26 whereas default app was 24. A config plugin was added to set SDK 26. The first follow-up APK compile exceeded the old 20-minute CI timeout, producing a **cancelled** check rather than evidence of an Android app failure. Android APK compilation is now a separate job with a longer timeout. A successful CI Gradle build still does **not** prove offline inference on a 4 GB phone.

## New native draft support

The **Ate Sora chat request form** now includes explicit Save/Delete local draft controls on native Android/iOS. On a signed-in native device, it restores at most the document type and the purpose field using account-scoped `expo-secure-store`; the draft is labeled **not submitted**. Attachments, other form fields, payment references and resident records are not persisted by this feature. A successful online submission removes the matching native draft.

The PWA web button is intentionally disabled: persisting arbitrary residents' personal form details in unencrypted browser storage would expose data on shared/public phones. Browsers have Cache API for **public app assets** but do not automatically offer secure offline persistence for application drafts. Implement a consent-driven encrypted IndexedDB design with an explicit user-managed recovery key and authenticated manual sync before shipping web resident drafts. No automatic upload/synchronization is enabled.
