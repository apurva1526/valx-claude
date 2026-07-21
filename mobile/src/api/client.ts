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

const REQUEST_TIMEOUT_MS = 10000;

async function request<T>(path: string, options: RequestInit & AuthContext = {}): Promise<T> {
  const { token, profileId, headers, ...rest } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(profileId ? { "X-Profile-Id": profileId } : {}),
        ...headers,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(`Couldn't reach the server at ${API_BASE_URL} (timed out)`, 0);
    }
    throw new ApiError(`Couldn't reach the server at ${API_BASE_URL}`, 0);
  } finally {
    clearTimeout(timeout);
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
