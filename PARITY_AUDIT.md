# PWA to Expo parity audit

Audit snapshot: 2026-10-21. Source root `../BARANGAY_AI` was read-only throughout this task. Implementation root: `BarangayAI`. This report inventories every file returned by `rg --files` in the requested source trees (351 files total), excluding ignored dependencies and generated build output. The inventory is file-complete for those trees; parity remains feature-level and is explicitly marked below.


## 2026-10-21 remediation

- Replaced the Expo screen's mojibake icon characters and corrupted punctuation with readable UTF-8 text and named Material Symbols icons. Bundled the existing Expo Material Symbols Regular font asset and load it before showing routes.
- Added the PWA-style notification bell/count/menu, resident-scoped notification reads, and realtime refresh.
- Chat assistant replies now persist to the existing `chat_messages` table, in addition to user messages.
- Updated Expo sign-in layout against `apps/resident-pwa/app/(auth)/login/page.tsx` and `components/login-form.tsx`: removed the resident header on auth screens; matched the centered PWA logo/title, labels and inputs, sign-in action, inline registration link, divider, and guest assistant card; added password visibility toggle. The existing logo and Ate Sora avatar assets were SHA-256 compared to the PWA assets and match byte-for-byte.
- PWA source confirms Inter and Lucide React icons. The read-only source tree contains no Inter font binary; fetching `@expo-google-fonts/inter` failed with `EACCES` from the npm registry. No alternative font is being represented as Inter. Material Symbols are visually similar icons, not the original Lucide assets.
- Expo screenshot comparison could not be completed: the computer-use runtime failed to initialize (`failed to write kernel assets`). No Android/iOS device or emulator is attached, and no authenticated end-to-end data writes were performed.
## Feature crosswalk

| Source behavior | Source files | Expo implementation | Result |
|---|---|---|---|
| Auth/session | `apps/resident-pwa/app/(auth)/*`, `components/login-form.tsx`, `lib/supabase/*` | `src/components/ResidentApp.tsx` (Login, Register, Pending), `src/lib/supabase.ts` | Login/logout and persisted sessions use the shared Supabase Auth. Expo registration opens the existing PWA `/register` page in an in-app browser so the PWA's privileged server action handles account/ID validation. No service-role key is shipped to Expo; native-only registration is not available without a backend API. |
| Resident home | `apps/resident-pwa/app/(app)/home/page.tsx`, `app/(app)/layout.tsx`, `components/layout/*` | `src/components/ResidentApp.tsx` (Home), `src/components/ui.tsx` | Data/shortcuts implemented; layout is approximate and does not match the PWA pixel-for-pixel. |
| Requests and payments | `app/(app)/requests/**`, `components/payments/QRScanner.tsx` | `src/components/ResidentApp.tsx` (Requests, NewRequest, QRScanner) | List, submit, attachments, status, QR and payment-reference path implemented; only Expo bundle verification, no authenticated device write test. |
| Announcements/programs | `app/(app)/announcements/page.tsx` | `src/components/ResidentApp.tsx` (Updates) | Shared Supabase reads, enrollment RPC, realtime implemented; device workflow unverified. |
| AI chat and forms | `app/(app)/chat/page.tsx`, `components/chat/ChatInterface.tsx`, `components/chat/InChatFormCard.tsx`, `lib/ai/*`, `app/api/chat/route.ts` | `src/components/ResidentApp.tsx` (Chat), `src/components/chat-request-form.tsx`, `src/lib/chat-document-forms.ts` | Existing text chat endpoint and Supabase transcript persistence remain. Native in-chat forms now trigger only for one explicit supported document request and write request, attachment, transaction, and business data to the same PWA tables. Multi-document batching in one card remains incomplete. |
| Voice | `hooks/useTTS.ts`, `hooks/useSTT.ts`, `app/api/tts/route.ts`; backend `apps/api/routers/tts_router.py` | No native voice equivalent | TTS playback and STT capture are missing. Existing backend TTS endpoint exists, but Expo audio capture/playback workflow is not implemented. |
| Profile/onboarding | `app/(app)/profile/page.tsx`, `components/onboarding/ResidentOnboardingDialog.tsx`, `app/(app)/onboarding/actions.ts` | `src/components/ResidentApp.tsx` (Profile) | Profile UI, notification reads and household onboarding exist; visual/data parity is partial. |
| Push/offline | `hooks/useNotifications.ts`, `lib/push.ts`, `app/api/notifications/subscribe/route.ts`, `app/~offline/page.tsx`, `worker/index.ts` | No native push/offline equivalent | Browser Web Push/service worker is not portable to Expo; the backend has no Expo push registration/delivery path. Offline queue/cache not implemented. |
| Admin resident workflows | `apps/admin-portal/app/(dashboard)/**`, relevant actions/components | Expo resident routes read shared records; admin-only screens correctly absent | Announcement/program/request read/write contracts align with shared Supabase tables where implemented. End-to-end admin round-trip not device-tested. |
| Backend and AI | `apps/api/**`, `services/ai/**`, `packages/shared-types/src/index.ts` | `src/components/ResidentApp.tsx` uses configured PWA/API endpoints; `src/lib/supabase.ts` | Text chat and shared Supabase paths implemented. Other backend/AI service contracts are inventoried below; unused or admin-only services have no resident screen counterpart. |

## Verification status

- `npm.cmd run lint -- --quiet` in `BarangayAI` after remediation: passed.
- Android Expo export after remediation: passed (3.5 MB Hermes bundle).
- `node_modules/.bin/tsc --noEmit` after remediation: passed with exit code 0.
- Previous implementation record (`MOBILE_IMPLEMENTATION_STATUS.md`) documents web export, the resident PWA suite (15 passed), read-only Supabase health/catalog queries, and local service health checks. Those are prior results, not repeated here.
- Android and web exports after remediation: passed; web generated 14 static routes. No device/emulator is attached. Authenticated writes, camera permissions, file uploads, AI response, TTS/STT, native notification delivery, visual screenshot comparison, and cross-portal update propagation have not been verified end-to-end.
- Expo Metro is running at `http://localhost:8084`; `/status` returned `packager-status:running`.

### Sign-in visual parity pass (2026-10-21)

| PWA reference | Expo implementation | Current result |
|---|---|---|
| `app/(auth)/login/page.tsx` centered white sign-in panel | `src/components/ResidentApp.tsx` `Login` | Layout and content aligned from source inspection; no side-by-side device screenshot review yet |
| `components/login-form.tsx` username/password validation and Supabase sign-in | `ResidentApp.tsx` `Login` | Existing email/resident-code auth flow retained; password show/hide added; not tested with a live account |
| PWA logo and Ate Sora guest avatar | `assets/images/barangay-logo.png`, `assets/images/ate-sora.jpg` | Both assets have matching SHA-256 hashes with the corresponding PWA public assets |

Checks after the sign-in update: Expo lint passed; TypeScript passed; Android export passed (3.5 MB Hermes bundle); web export passed (14 static routes). The web export confirms the route bundles, but is not a screenshot or device interaction test. The computer-use screenshot runtime failed to initialize and no Android/iOS device or emulator is attached, so visual and live Auth verification remain outstanding.

## Complete source inventory

### Resident PWA (88 files)

- `apps\resident-pwa\.env.example`
- `apps\resident-pwa\app\(app)\announcements\page.tsx`
- `apps\resident-pwa\app\(app)\chat\page.tsx`
- `apps\resident-pwa\app\(app)\home\page.tsx`
- `apps\resident-pwa\app\(app)\layout.tsx`
- `apps\resident-pwa\app\(app)\onboarding\actions.ts`
- `apps\resident-pwa\app\(app)\profile\page.tsx`
- `apps\resident-pwa\app\(app)\requests\actions.ts`
- `apps\resident-pwa\app\(app)\requests\new\page.tsx`
- `apps\resident-pwa\app\(app)\requests\page.tsx`
- `apps\resident-pwa\app\(app)\requests\payment-actions.ts`
- `apps\resident-pwa\app\(auth)\login\actions.ts`
- `apps\resident-pwa\app\(auth)\login\page.tsx`
- `apps\resident-pwa\app\(auth)\pending-approval\page.tsx`
- `apps\resident-pwa\app\(auth)\pending-approval\refresh-status-button.tsx`
- `apps\resident-pwa\app\(auth)\pending-approval\sign-out-button.tsx`
- `apps\resident-pwa\app\(auth)\register\actions.ts`
- `apps\resident-pwa\app\(auth)\register\page.tsx`
- `apps\resident-pwa\app\~offline\page.tsx`
- `apps\resident-pwa\app\api\chat\route.ts`
- `apps\resident-pwa\app\api\notifications\subscribe\route.ts`
- `apps\resident-pwa\app\api\policies\route.ts`
- `apps\resident-pwa\app\api\tts\route.ts`
- `apps\resident-pwa\app\auth\callback\route.ts`
- `apps\resident-pwa\app\globals.css`
- `apps\resident-pwa\app\icon.png`
- `apps\resident-pwa\app\layout.tsx`
- `apps\resident-pwa\app\page.tsx`
- `apps\resident-pwa\components\auth\PreAuthWelcome.tsx`
- `apps\resident-pwa\components\auth\RegisterForm.tsx`
- `apps\resident-pwa\components\camera\CameraCapture.tsx`
- `apps\resident-pwa\components\chat\ChatInterface.tsx`
- `apps\resident-pwa\components\chat\InChatFormCard.tsx`
- `apps\resident-pwa\components\guest\GuestAuthModal.tsx`
- `apps\resident-pwa\components\layout\BottomNav.tsx`
- `apps\resident-pwa\components\layout\TopBar.tsx`
- `apps\resident-pwa\components\login-form.tsx`
- `apps\resident-pwa\components\onboarding\ResidentOnboardingDialog.tsx`
- `apps\resident-pwa\components\payments\QRScanner.tsx`
- `apps\resident-pwa\components\providers.tsx`
- `apps\resident-pwa\components\sw-killer.tsx`
- `apps\resident-pwa\hooks\useNotifications.ts`
- `apps\resident-pwa\hooks\useSTT.ts`
- `apps\resident-pwa\hooks\useTTS.ts`
- `apps\resident-pwa\lib\ai\config.ts`
- `apps\resident-pwa\lib\ai\document-forms.ts`
- `apps\resident-pwa\lib\ai\policy-knowledge.ts`
- `apps\resident-pwa\lib\ai\sora-agent.ts`
- `apps\resident-pwa\lib\capture-quality.cjs`
- `apps\resident-pwa\lib\id-image-validation.cjs`
- `apps\resident-pwa\lib\id-text-classification.cjs`
- `apps\resident-pwa\lib\push.ts`
- `apps\resident-pwa\lib\registration-validation.cjs`
- `apps\resident-pwa\lib\supabase\admin.ts`
- `apps\resident-pwa\lib\supabase\client.ts`
- `apps\resident-pwa\lib\supabase\config.ts`
- `apps\resident-pwa\lib\supabase\mock-supabase.ts`
- `apps\resident-pwa\lib\supabase\server.ts`
- `apps\resident-pwa\lib\utils.ts`
- `apps\resident-pwa\middleware.ts`
- `apps\resident-pwa\next.config.js`
- `apps\resident-pwa\next-env.d.ts`
- `apps\resident-pwa\package.json`
- `apps\resident-pwa\postcss.config.js`
- `apps\resident-pwa\public\ate-sora.jpg`
- `apps\resident-pwa\public\ate-sora.svg`
- `apps\resident-pwa\public\documents\barangay-business-permitting.txt`
- `apps\resident-pwa\public\documents\barangay-clearance-policy.txt`
- `apps\resident-pwa\public\documents\barangay-document-services.txt`
- `apps\resident-pwa\public\documents\barangay-ordinances.txt`
- `apps\resident-pwa\public\documents\README.md`
- `apps\resident-pwa\public\favicon.ico`
- `apps\resident-pwa\public\icons\pwa-192x192.png`
- `apps\resident-pwa\public\icons\pwa-512x512.png`
- `apps\resident-pwa\public\logo.png`
- `apps\resident-pwa\public\logo-icon.png`
- `apps\resident-pwa\public\manifest.json`
- `apps\resident-pwa\public\onboarding\community.jpg`
- `apps\resident-pwa\public\onboarding\documents.jpg`
- `apps\resident-pwa\public\onboarding\support.jpg`
- `apps\resident-pwa\tailwind.config.js`
- `apps\resident-pwa\tests\capture-quality.test.cjs`
- `apps\resident-pwa\tests\id-image-validation.test.cjs`
- `apps\resident-pwa\tests\id-text-classification.test.cjs`
- `apps\resident-pwa\tests\registration-validation.test.cjs`
- `apps\resident-pwa\tests\updates-performance.test.mjs`
- `apps\resident-pwa\tsconfig.json`
- `apps\resident-pwa\worker\index.ts`

### Admin Portal (111 files)

- `apps\admin-portal\.env.example`
- `apps\admin-portal\app\(auth)\login\actions.ts`
- `apps\admin-portal\app\(auth)\login\page.tsx`
- `apps\admin-portal\app\(dashboard)\administration\actions.ts`
- `apps\admin-portal\app\(dashboard)\administration\audit\components\AuditTable.tsx`
- `apps\admin-portal\app\(dashboard)\administration\audit\page.tsx`
- `apps\admin-portal\app\(dashboard)\administration\policies\actions.ts`
- `apps\admin-portal\app\(dashboard)\administration\policies\page.tsx`
- `apps\admin-portal\app\(dashboard)\administration\rbac-actions.ts`
- `apps\admin-portal\app\(dashboard)\administration\reports\page.tsx`
- `apps\admin-portal\app\(dashboard)\administration\roles\components\RolesClient.tsx`
- `apps\admin-portal\app\(dashboard)\administration\roles\page.tsx`
- `apps\admin-portal\app\(dashboard)\administration\settings\page.tsx`
- `apps\admin-portal\app\(dashboard)\administration\users\components\UsersClient.tsx`
- `apps\admin-portal\app\(dashboard)\administration\users\page.tsx`
- `apps\admin-portal\app\(dashboard)\boarders\actions.ts`
- `apps\admin-portal\app\(dashboard)\boarders\components\BoardersClient.tsx`
- `apps\admin-portal\app\(dashboard)\boarders\page.tsx`
- `apps\admin-portal\app\(dashboard)\business\actions.ts`
- `apps\admin-portal\app\(dashboard)\business\permits\components\BusinessPermitsClient.tsx`
- `apps\admin-portal\app\(dashboard)\business\permits\page.tsx`
- `apps\admin-portal\app\(dashboard)\business\registry\components\BusinessClient.tsx`
- `apps\admin-portal\app\(dashboard)\business\registry\components\BusinessTable.tsx`
- `apps\admin-portal\app\(dashboard)\business\registry\page.tsx`
- `apps\admin-portal\app\(dashboard)\communication\actions.ts`
- `apps\admin-portal\app\(dashboard)\communication\announcements\components\AnnouncementList.tsx`
- `apps\admin-portal\app\(dashboard)\communication\announcements\page.tsx`
- `apps\admin-portal\app\(dashboard)\communication\appointments\page.tsx`
- `apps\admin-portal\app\(dashboard)\communication\notifications\page.tsx`
- `apps\admin-portal\app\(dashboard)\communication\transactions\page.tsx`
- `apps\admin-portal\app\(dashboard)\community\actions.ts`
- `apps\admin-portal\app\(dashboard)\community\announcements\actions.ts`
- `apps\admin-portal\app\(dashboard)\community\announcements\page.tsx`
- `apps\admin-portal\app\(dashboard)\community\officials\components\OfficialCreateForm.tsx`
- `apps\admin-portal\app\(dashboard)\community\officials\components\OfficialsTable.tsx`
- `apps\admin-portal\app\(dashboard)\community\officials\page.tsx`
- `apps\admin-portal\app\(dashboard)\community\precinct\page.tsx`
- `apps\admin-portal\app\(dashboard)\community\precinct\PrecinctCreateForm.tsx`
- `apps\admin-portal\app\(dashboard)\community\purok\page.tsx`
- `apps\admin-portal\app\(dashboard)\community\purok\PurokCreateForm.tsx`
- `apps\admin-portal\app\(dashboard)\dashboard\actions.ts`
- `apps\admin-portal\app\(dashboard)\dashboard\components.tsx`
- `apps\admin-portal\app\(dashboard)\dashboard\components\DashboardRealtime.tsx`
- `apps\admin-portal\app\(dashboard)\dashboard\page.tsx`
- `apps\admin-portal\app\(dashboard)\documents\actions.ts`
- `apps\admin-portal\app\(dashboard)\documents\business-clearance\page.tsx`
- `apps\admin-portal\app\(dashboard)\documents\certificates\page.tsx`
- `apps\admin-portal\app\(dashboard)\documents\policies\page.tsx`
- `apps\admin-portal\app\(dashboard)\documents\requests\components\CertificateTemplateModal.tsx`
- `apps\admin-portal\app\(dashboard)\documents\requests\components\RequestsClient.tsx`
- `apps\admin-portal\app\(dashboard)\documents\requests\components\RequestsTable.tsx`
- `apps\admin-portal\app\(dashboard)\documents\requests\page.tsx`
- `apps\admin-portal\app\(dashboard)\knowledge\page.tsx`
- `apps\admin-portal\app\(dashboard)\layout.tsx`
- `apps\admin-portal\app\(dashboard)\organizations\actions.ts`
- `apps\admin-portal\app\(dashboard)\organizations\components\OrganizationsClient.tsx`
- `apps\admin-portal\app\(dashboard)\organizations\page.tsx`
- `apps\admin-portal\app\(dashboard)\programs\actions.ts`
- `apps\admin-portal\app\(dashboard)\programs\components\ProgramsClient.tsx`
- `apps\admin-portal\app\(dashboard)\programs\page.tsx`
- `apps\admin-portal\app\(dashboard)\residents\4ps\page.tsx`
- `apps\admin-portal\app\(dashboard)\residents\actions.ts`
- `apps\admin-portal\app\(dashboard)\residents\actions\createResidentWithCredentials.ts`
- `apps\admin-portal\app\(dashboard)\residents\components\ResidentsClient.tsx`
- `apps\admin-portal\app\(dashboard)\residents\components\ResidentTable.tsx`
- `apps\admin-portal\app\(dashboard)\residents\forms\ResidentForm.tsx`
- `apps\admin-portal\app\(dashboard)\residents\household\page.tsx`
- `apps\admin-portal\app\(dashboard)\residents\page.tsx`
- `apps\admin-portal\app\(dashboard)\residents\pwd\page.tsx`
- `apps\admin-portal\app\(dashboard)\residents\senior\page.tsx`
- `apps\admin-portal\app\(dashboard)\residents\verification\components\VerificationQueueClient.tsx`
- `apps\admin-portal\app\(dashboard)\residents\verification\loading.tsx`
- `apps\admin-portal\app\(dashboard)\residents\verification\page.tsx`
- `apps\admin-portal\app\auth\callback\route.ts`
- `apps\admin-portal\app\globals.css`
- `apps\admin-portal\app\icon.png`
- `apps\admin-portal\app\layout.tsx`
- `apps\admin-portal\app\page.tsx`
- `apps\admin-portal\components\auth\PreAuthWelcome.tsx`
- `apps\admin-portal\components\auth-provider.tsx`
- `apps\admin-portal\components\layout\Header.tsx`
- `apps\admin-portal\components\layout\Sidebar.tsx`
- `apps\admin-portal\components\login-form.tsx`
- `apps\admin-portal\components\providers.tsx`
- `apps\admin-portal\components\ui\AdminTable.tsx`
- `apps\admin-portal\components\ui\PageHeader.tsx`
- `apps\admin-portal\lib\navigation.ts`
- `apps\admin-portal\lib\permissions.ts`
- `apps\admin-portal\lib\supabase\admin.ts`
- `apps\admin-portal\lib\supabase\client.ts`
- `apps\admin-portal\lib\supabase\config.ts`
- `apps\admin-portal\lib\supabase\mock-supabase.ts`
- `apps\admin-portal\lib\supabase\server.ts`
- `apps\admin-portal\lib\utils.ts`
- `apps\admin-portal\middleware.ts`
- `apps\admin-portal\next.config.js`
- `apps\admin-portal\next-env.d.ts`
- `apps\admin-portal\package.json`
- `apps\admin-portal\postcss.config.js`
- `apps\admin-portal\public\favicon.ico`
- `apps\admin-portal\public\logo.png`
- `apps\admin-portal\public\logo-icon.png`
- `apps\admin-portal\public\onboarding\community.jpg`
- `apps\admin-portal\public\onboarding\documents.jpg`
- `apps\admin-portal\public\onboarding\support.jpg`
- `apps\admin-portal\scratch\seed_users.js`
- `apps\admin-portal\tailwind.config.js`
- `apps\admin-portal\tests\document-workflow.test.mjs`
- `apps\admin-portal\tests\navigation-regression.test.mjs`
- `apps\admin-portal\tests\verification-performance.test.mjs`
- `apps\admin-portal\tsconfig.json`

### API (83 files)

- `apps\api\.env.example`
- `apps\api\core\auth.py`
- `apps\api\core\config.py`
- `apps\api\Dockerfile`
- `apps\api\graphql_api\__init__.py`
- `apps\api\graphql_api\errors.py`
- `apps\api\graphql_api\schema.py`
- `apps\api\graphql_api\security.py`
- `apps\api\graphql_api\types.py`
- `apps\api\list_models.py`
- `apps\api\main.py`
- `apps\api\manage_knowledge.py`
- `apps\api\requirements.txt`
- `apps\api\requirements-dev.txt`
- `apps\api\routers\__init__.py`
- `apps\api\routers\rag_router.py`
- `apps\api\routers\tts_router.py`
- `apps\api\seed_docs\barangay_clearance.txt`
- `apps\api\seed_docs\barangay_laws_philippines_verified.txt`
- `apps\api\seed_docs\barangay_service_catalog.txt`
- `apps\api\seed_docs\butuan_lgu_official_sources.txt`
- `apps\api\seed_docs\certificate_of_indigency.txt`
- `apps\api\seed_docs\tandang_sora_butuan_verified_laws.txt`
- `apps\api\seed_knowledge.py`
- `apps\api\services\ai\__init__.py`
- `apps\api\services\ai\circuit_breaker.py`
- `apps\api\services\ai\embeddings\__init__.py`
- `apps\api\services\ai\embeddings\interfaces.py`
- `apps\api\services\ai\embeddings\manager.py`
- `apps\api\services\ai\embeddings\providers\__init__.py`
- `apps\api\services\ai\embeddings\providers\gemini.py`
- `apps\api\services\ai\embeddings\providers\local.py`
- `apps\api\services\ai\embeddings\queue.py`
- `apps\api\services\ai\error_classifier.py`
- `apps\api\services\ai\grounding\__init__.py`
- `apps\api\services\ai\grounding\context_validator.py`
- `apps\api\services\ai\grounding\query_router.py`
- `apps\api\services\ai\grounding\response_validator.py`
- `apps\api\services\ai\interfaces.py`
- `apps\api\services\ai\language\__init__.py`
- `apps\api\services\ai\language\language_detector.py`
- `apps\api\services\ai\language\multilingual_retriever.py`
- `apps\api\services\ai\language\normalization.py`
- `apps\api\services\ai\language\response_language.py`
- `apps\api\services\ai\language\terminology.py`
- `apps\api\services\ai\manager.py`
- `apps\api\services\ai\model_router.py`
- `apps\api\services\ai\policy\data_access_policy.py`
- `apps\api\services\ai\policy\policy_engine.py`
- `apps\api\services\ai\policy\safety_rules.py`
- `apps\api\services\ai\providers\base_provider.py`
- `apps\api\services\ai\providers\gemini_provider.py`
- `apps\api\services\ai\providers\groq_provider.py`
- `apps\api\services\ai\providers\ollama_provider.py`
- `apps\api\services\ai\providers\openrouter_provider.py`
- `apps\api\services\ai\retrieval\hybrid_search.py`
- `apps\api\services\ai\retrieval\reranker.py`
- `apps\api\services\ai\tools\planner.py`
- `apps\api\services\ai\tools\registry.py`
- `apps\api\services\audit_service.py`
- `apps\api\services\guard_service.py`
- `apps\api\services\ingestion\db_sync.py`
- `apps\api\services\ingestion\document_parser.py`
- `apps\api\services\ingestion\web_scraper.py`
- `apps\api\services\knowledge_graph\entities.py`
- `apps\api\services\knowledge_graph\extraction.py`
- `apps\api\services\knowledge_graph\graph_store.py`
- `apps\api\services\knowledge_graph\relationships.py`
- `apps\api\services\memory\memory_policy.py`
- `apps\api\services\memory\memory_retriever.py`
- `apps\api\services\memory\memory_service.py`
- `apps\api\services\memory\summarizer.py`
- `apps\api\services\orchestrator.py`
- `apps\api\services\stream_service.py`
- `apps\api\services\supabase_service.py`
- `apps\api\test_api.py`
- `apps\api\test_apis.py`
- `apps\api\test_chat.py`
- `apps\api\test_embedding.py`
- `apps\api\test_failover.py`
- `apps\api\test_llm.py`
- `apps\api\test_raw.py`
- `apps\api\tests\test_openai_tts.py`

### Shared types (2 files)

- `packages\shared-types\package.json`
- `packages\shared-types\src\index.ts`

### AI services (67 files)

- `services\ai\pdf-processor\.env.example`
- `services\ai\pdf-processor\app\__init__.py`
- `services\ai\pdf-processor\app\config.py`
- `services\ai\pdf-processor\app\errors.py`
- `services\ai\pdf-processor\app\logging_config.py`
- `services\ai\pdf-processor\app\main.py`
- `services\ai\pdf-processor\app\ratelimit.py`
- `services\ai\pdf-processor\app\routes\__init__.py`
- `services\ai\pdf-processor\app\routes\documents.py`
- `services\ai\pdf-processor\app\schemas\__init__.py`
- `services\ai\pdf-processor\app\schemas\document.py`
- `services\ai\pdf-processor\app\services\__init__.py`
- `services\ai\pdf-processor\app\services\opendataloader.py`
- `services\ai\pdf-processor\Dockerfile`
- `services\ai\pdf-processor\README.md`
- `services\ai\pdf-processor\requirements.txt`
- `services\ai\pdf-processor\requirements-dev.txt`
- `services\ai\pdf-processor\tests\__init__.py`
- `services\ai\pdf-processor\tests\test_api.py`
- `services\ai\pdf-processor\tests\test_documents.py`
- `services\ai\README.md`
- `services\ai\translation\.env.example`
- `services\ai\translation\app\__init__.py`
- `services\ai\translation\app\config.py`
- `services\ai\translation\app\errors.py`
- `services\ai\translation\app\logging_config.py`
- `services\ai\translation\app\main.py`
- `services\ai\translation\app\ratelimit.py`
- `services\ai\translation\app\routes\__init__.py`
- `services\ai\translation\app\routes\translate.py`
- `services\ai\translation\app\schemas\__init__.py`
- `services\ai\translation\app\schemas\translation.py`
- `services\ai\translation\app\services\__init__.py`
- `services\ai\translation\app\services\lingvanex.py`
- `services\ai\translation\Dockerfile`
- `services\ai\translation\models\.gitkeep`
- `services\ai\translation\README.md`
- `services\ai\translation\requirements.txt`
- `services\ai\translation\requirements-dev.txt`
- `services\ai\translation\scripts\download_models.py`
- `services\ai\translation\tests\__init__.py`
- `services\ai\translation\tests\test_api.py`
- `services\ai\translation\tests\test_lingvanex.py`
- `services\ai\tts\.env.example`
- `services\ai\tts\app\__init__.py`
- `services\ai\tts\app\cleanup.py`
- `services\ai\tts\app\config.py`
- `services\ai\tts\app\errors.py`
- `services\ai\tts\app\logging_config.py`
- `services\ai\tts\app\main.py`
- `services\ai\tts\app\ratelimit.py`
- `services\ai\tts\app\routes\__init__.py`
- `services\ai\tts\app\routes\speech.py`
- `services\ai\tts\app\schemas\__init__.py`
- `services\ai\tts\app\schemas\speech.py`
- `services\ai\tts\app\services\__init__.py`
- `services\ai\tts\app\services\f5tts.py`
- `services\ai\tts\app\services\mms_tts.py`
- `services\ai\tts\Dockerfile`
- `services\ai\tts\models\.gitkeep`
- `services\ai\tts\README.md`
- `services\ai\tts\requirements.txt`
- `services\ai\tts\requirements-dev.txt`
- `services\ai\tts\requirements-ml.txt`
- `services\ai\tts\tests\__init__.py`
- `services\ai\tts\tests\test_api.py`
- `services\ai\tts\tests\test_f5tts.py`

## Files under the Expo implementation

- `src/app/**`: route entry points and Expo Router layout; screen behavior delegates to the shared resident app component.
- `src/components/ResidentApp.tsx`: resident workflows (auth, home, requests, new request, updates, chat, profile, pending approval, scanner).
- `src/components/ui.tsx`, `src/constants/**`, `src/global.css`: visual primitives/theme.
- `src/lib/supabase.ts`: existing project client and native/browser session persistence.
- `assets/images/**`: PWA branding assets copied into the mobile project.
- `app.json`, `package.json`, lockfile, `.env.example`: Expo/native configuration and public client settings.

This audit does not claim 100% parity. In particular, secure registration, structured chat forms, TTS/STT, native push, offline queueing, screenshot-level design matching, and real device/admin round-trip tests remain incomplete or unavailable.






