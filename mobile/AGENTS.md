# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Pinned to SDK 54. This app runs on a custom EAS development client (not Expo Go) — required for push notifications and other native modules. Bumping the SDK means rebuilding the dev client (`eas build --profile development --platform all`) and reinstalling it on-device before `npx expo start --dev-client` will work again; it's no longer just a matter of matching an installed Expo Go version.
