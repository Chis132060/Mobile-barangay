# Mobile app configuration

This Expo Go frontend uses the same Supabase URL and anon/publishable key as the resident PWA. Keep those values local in `.env.local`; never place service-role keys in Expo config.

Copy `.env.example` to `.env.local`. For a physical phone, set `EXPO_PUBLIC_API_BASE_URL` to a reachable backend host (same Wi-Fi LAN IP or deployed HTTPS URL). `localhost` on the phone is the phone itself. The current PWA has mock Supabase enabled in its local web configuration; mobile authentication talks to the real configured Supabase Auth project.

Registration remains routed to the existing secure server flow conceptually; no registration endpoint in the repository allows the PWA service-role operation to be safely called from a native client. Do not add privileged credentials to this app. Payment and attachment operations use authenticated Supabase client policies and the same existing tables/buckets.
