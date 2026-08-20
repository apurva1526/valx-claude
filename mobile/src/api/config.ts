import Constants from "expo-constants";

const BACKEND_PORT = 4000;

// Standalone builds (TestFlight, Play, production EAS builds) have no Metro server to
// derive a host from, so they need a fixed, deployed backend URL baked in at build time
// via EXPO_PUBLIC_API_URL (see eas.json's build.production.env).
//
// In local dev, Expo Go/dev-client connect to Metro over your Mac's current LAN IP, which
// changes whenever you switch Wi-Fi networks — reuse that same host for the backend
// instead of a hardcoded IP, so this doesn't need manual updates every time the network changes.
function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).expoGoConfig?.debuggerHost;
  const host = typeof hostUri === "string" ? hostUri.split(":")[0] : undefined;
  return host ? `http://${host}:${BACKEND_PORT}` : `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");
