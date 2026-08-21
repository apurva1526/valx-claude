import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

interface AuthContext {
  token?: string;
  profileId?: string;
}

const REQUEST_TIMEOUT_MS = 25000;
// A bad WiFi router/ISP DNS cache can make a single lookup fail transiently even though
// the domain is fine everywhere else; a same-request retry gets a fresh DNS attempt and
// silently recovers most of the time instead of showing the user a scary error screen.
//
// This is restricted to GET: a "Network request failed" TypeError isn't only thrown when a
// connection never got established — it can also fire if the connection resets while the
// response is streaming back, i.e. *after* the server already fully processed the request
// (this is exactly the class of reset server.ts's keepAliveTimeout comment describes). For a
// GET that's harmless to repeat either way. For POST/PATCH/DELETE it isn't: retrying
// closeBid, submitResponse, or deactivateProfile after a reset-during-response could replay
// a request the server already completed, surfacing a false "already closed" / "price must
// be lower" / stale-count error even though the original call succeeded.
const NETWORK_RETRY_DELAYS_MS = [300, 900];
const NETWORK_RETRY_METHODS = new Set(["GET"]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function request<T>(path: string, options: RequestInit & AuthContext = {}): Promise<T> {
  const { token, profileId, headers, ...rest } = options;
  const url = `${API_BASE_URL}${path}`;
  const init: RequestInit = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(profileId ? { "X-Profile-Id": profileId } : {}),
      ...headers,
    },
  };

  const method = (init.method ?? "GET").toUpperCase();
  const isRetryableMethod = NETWORK_RETRY_METHODS.has(method);

  let response: Response;
  let attempt = 0;
  for (;;) {
    try {
      response = await fetchWithTimeout(url, init);
      break;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new ApiError(`Couldn't reach the server at ${API_BASE_URL} (timed out)`, 0);
      }
      const isNetworkFailure = err instanceof TypeError;
      if (isNetworkFailure && isRetryableMethod && attempt < NETWORK_RETRY_DELAYS_MS.length) {
        await sleep(NETWORK_RETRY_DELAYS_MS[attempt]);
        attempt += 1;
        continue;
      }
      const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      throw new ApiError(`Couldn't reach the server at ${API_BASE_URL}\n[${detail}]`, 0);
    }
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(body?.error ?? `Request failed with status ${response.status}`, response.status);
  }

  return body as T;
}

export function get<T>(path: string, auth?: AuthContext): Promise<T> {
  return request<T>(path, { method: "GET", ...auth });
}

export function post<T>(path: string, data: unknown, auth?: AuthContext): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(data), ...auth });
}

export function patch<T>(path: string, data: unknown, auth?: AuthContext): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(data), ...auth });
}

export function del<T>(path: string, auth?: AuthContext): Promise<T> {
  return request<T>(path, { method: "DELETE", ...auth });
}
