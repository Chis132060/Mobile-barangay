# Mobile implementation status

## Implemented in `BarangayAI`

| PWA workflow | Mobile state | Integration |
|---|---|---|
| Resident sign-in / sign-out | Implemented | Same Supabase Auth; resident code maps to the existing synthetic auth email; SecureStore session persistence |
| Resident dashboard | Implemented | Auth metadata, published announcements, current request, service shortcuts |
| Requests | Implemented | Resident-scoped list, status filters, detail view, Supabase Realtime updates |
| New document request | Implemented | Reads `document_types`; validates required files, 5 MB limit and PDF/JPG/PNG; uploads to `document-requirements`; inserts `document_requests` using the signed-in resident |
| Payment reference | Implemented | Confirms request ownership, fee and existing payment state; inserts `payments`, updates request status; camera QR scanner fills reference |
| Announcements and programs | Implemented | Published announcements, public programs, filters, resident applications via `apply_to_barangay_program`, live refresh |
| AI chat | Implemented for text | Uses existing PWA `/api/chat` when `EXPO_PUBLIC_PWA_API_URL` is set; otherwise signed-in direct FastAPI `/api/v1/chat`; persists sessions/messages for signed-in users |
| Profile | Implemented with known differences | Updates Supabase Auth user metadata; lists/marks notifications read; information dialogs |
| Household onboarding | Implemented | Uses the existing residents, households, household_members and audit_logs tables, gated on verified status |
| Pending approval | Implemented | Reads verification status/rejection reason and can refresh/sign out |
| ID camera capture | PWA registration handoff | The Expo registration route now opens the existing secure PWA `/register` workflow in the system browser, so server-side ID validation and the original privileged action remain server-side and create the same Supabase account. Native in-app account creation is still unavailable because the repository has no mobile-safe registration API. |
| Ate Sora document forms | Implemented for explicit single-document requests | The chat now opens a native form only for a single PWA-supported explicit document request. It writes to the same `request_transactions`, `document_requests`, `documents`, and `businesses` tables used by the PWA workflow. Clearance, indigency, residency, and business form fields are supported. Multi-document batching within one form card is not yet replicated. |

## Work blocked by the read-only backend constraint

The existing PWA registration server action creates an account with Supabase Admin Auth using a service-role credential, performs server-side ID image validation, creates related user/resident/address rows, and cleans up partial failures. The repository has no equivalent callable mobile registration API. Expo now hands the user to that existing PWA registration page; this keeps the privileged action server-side and reuses the same Supabase project, but the registration form itself is not native.

The chat client supports text and native structured forms for one document per chat turn; the PWA's multi-document batching is not yet replicated. TTS audio playback and speech-to-text remain missing. Expo SDK 57 audio/speech packages could not be installed in this network-restricted session (Expo package resolution failed with `EACCES`), and the existing PWA uses browser speech recognition. Native push registration cannot use the PWA's browser Web Push endpoint, and an Expo push backend endpoint is not present. Offline caching/queueing is also not implemented.

## Configuration

`.env.local` is ignored by Git and contains only the existing public Supabase URL/anon key plus local endpoint settings. The URL and anon key were compared against the PWA file without printing values. The physical-device PWA/API URLs must use a host reachable from the phone; `localhost` on a phone is the phone itself. Never add the service-role key or AI provider keys to this Expo app.

## Verification record

- `npx tsc --noEmit`: passed.
- `npm run lint -- --quiet`: passed.
- `npx expo export --platform android --output-dir dist`: passed; Android bundle created.
- `npx expo export --platform web --output-dir web-build`: passed after adding an SSR-safe browser storage adapter.
- Existing resident PWA tests: **15 passed, 0 failed**. No PWA build was run because it writes into the read-only PWA folder.
- Supabase Auth health: HTTP 200. Read-only `document_types` REST query: HTTP 200.
- Local resident PWA `/api/policies` and FastAPI `/health`: HTTP 200.
- `apps/resident-pwa` tracked source diff/status: clean. The PWA repository still has its pre-existing root `package-lock.json` modification and prior-turn untracked audit documentation outside `apps/resident-pwa`.
- Expo Metro was started in LAN mode. No physical device/emulator was attached, so in-device Expo Go UI, camera permission, authenticated workflows, uploads, payment writes, program enrollment, and chat request/response were not end-to-end tested. No production records were written.
- Expo Doctor's remote diagnostic did not complete in the network-restricted session. Metro reported a denied cache-directory write for its optional React Native DevTools auto-install and used its fallback; this did not prevent Android/web bundling.

## 2026-10-21 implementation follow-up

- Added Expo chat document forms for the four existing PWA document requests. Form triggers mirror the PWA's explicit/unique document matching. The form reads the authenticated verified resident, validates required data and attachments, uploads to the existing `request-attachments` bucket, and inserts the same request transaction/request/document/business rows consumed by the PWA and Admin Portal.
- Added dynamic form-schema rendering for PWA `formSchema.fields`, required-field checks, and business details. The current mobile form submits one document per chat turn; PWA multi-document transaction batching remains a gap.
- Replaced the non-submitting native registration wizard with an in-app-browser handoff to the existing PWA `/register` page. Registration remains server-side and uses the existing Supabase Admin Auth path; no service key or new backend was added.
- Added focused form-trigger tests: **2 passed**. Existing resident PWA tests: **15 passed**. Admin Portal request/navigation tests: **5 passed**.
- Re-ran Expo lint and TypeScript: passed. Android and web exports passed (14 web routes). Expo web dev server started on port 8085; `/login`, `/chat`, `/register`, `/requests/new`, and `/home` returned HTTP 200.
- Full authenticated submission, storage upload, chat response, and admin realtime round trip were not exercised because no resident test account/device is attached and no test records were written. `adb` is unavailable.
- Expo audio/speech packages are absent and package resolution failed with `EACCES` in this network-restricted environment. The PWA's browser speech recognition has no existing native STT endpoint; native TTS/STT and Expo push/offline paths remain unimplemented.
- `BARANGAY_AI/apps/resident-pwa` git status is clean; no files in `BARANGAY_AI` were changed.

This implementation is substantial but does not meet 100% 1:1 parity until native voice/push paths and device-backed end-to-end verification are available.
