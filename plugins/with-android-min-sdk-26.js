// Expo prebuild generates Android files; keep the native AI SDK floor in managed config.
// expo-ai-kit v0.18.2 requires Android API 26 (Android 8.0).
const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withAndroidMinSdk26(config) {
  return withGradleProperties(config, (config) => {
    const key = 'android.minSdkVersion';
    config.modResults = config.modResults.filter(item => item.key !== key);
    config.modResults.push({ type: 'property', key, value: '26' });
    return config;
  });
};
