import { API_BASE_URL } from "./config";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(body?.error ?? `Request failed with status ${response.status}`, response.status);
  }

  return body as T;
}

export function get<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, { method: "GET", token });
}

export function post<T>(path: string, data: unknown, token?: string): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(data), token });
}
