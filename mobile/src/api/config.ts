import Constants from "expo-constants";

const BACKEND_PORT = 4000;

// Expo Go connects to Metro over your Mac's current LAN IP, which changes whenever
// you switch Wi-Fi networks. Reuse that same host for the backend instead of a
// hardcoded IP, so this doesn't need manual updates every time the network changes.
function resolveApiBaseUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).expoGoConfig?.debuggerHost;
  const host = typeof hostUri === "string" ? hostUri.split(":")[0] : undefined;
  return host ? `http://${host}:${BACKEND_PORT}` : `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
