# Optional GGUF companion for Ate Sora (experimental)

The mobile app is **Expo/React Native**. The external `techjarves/Uncensored-Local-AI-Multiplatform` project is **Flutter** and cannot be transplanted as a React Native module. This integration does **not** copy its source or ship its APK.

The React Native app can optionally call the companion project's OpenAI-compatible HTTP server via **the same device's loopback interface** at `http://127.0.0.1:4891/v1/chat/completions`. This is entirely optional: its default is OFF.

## Try it in a native development build

1. Install a **trusted** build of the separate companion app on the same Android or iOS device. Verify the source, permissions and publisher; do not install untrusted APKs merely to test this feature.
2. In the companion app, download/load a GGUF model while online; confirm the model is ready, then start **Local API Server** on `127.0.0.1:4891`.
3. Open the native BarangayAI app, set Offline mode to `OFF`, and turn **GGUF companion** to ON. Ask a non-personal question.
4. Enable Airplane Mode with Wi-Fi and mobile data off and repeat. Native platform HTTP cleartext policies and background restrictions may prevent this cross-app interaction. A **real device test** is required.
5. If the companion does not answer, Ate Sora automatically tries its own on-device LLM, then bundled offline FAQs. Switch GGUF companion OFF to disable sending prompts to that local server.

## Security and limitations

- Requests are strictly limited to a hardcoded `127.0.0.1:4891` URL; no remote custom URL is accepted.
- The companion receives only the typed question and a public system instruction; **no credentials, resident personal records or Supabase data**. Do not type sensitive data into the companion. Another local app can potentially bind the same port.
- The external model may produce inaccurate or unsafe content. It is **not authoritative** for barangay ordinances, costs, hours, or records.
- The upstream repository README says MIT, but no license file appeared in the root during inspection. Avoid copying code/assets without verifying permissions.
- No claim of native interoperability is made until Android/iOS builds and Airplane Mode tests succeed.
