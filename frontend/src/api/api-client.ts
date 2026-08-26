import { getApiBaseUrl } from "./api-config";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../auth/auth-token-store";
import type { AuthResponse } from "../auth/auth-types";

const API_BASE_URL = getApiBaseUrl();
const REFRESH_PATH = "/auth/refresh";

let refreshPromise: Promise<string> | null = null;
const sessionExpiredListeners = new Set<() => void>();

export function registerSessionExpiredListener(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);

  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function notifySessionExpired(): void {
  for (const listener of sessionExpiredListeners) {
    listener();
  }
}

export class ApiError extends Error {
  details: unknown;

  constructor(message: string, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await request(path, init);

  if (response.status === 401 && path !== REFRESH_PATH && getAccessToken()) {
    await refreshAccessToken();

    return parseResponse<T>(await request(path, init));
  }

  return parseResponse<T>(response);
}

async function request(
  path: string,
  init: RequestInit | undefined,
): Promise<Response> {
  const headers = new Headers({
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  });
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(API_BASE_URL + path, {
    ...init,
    credentials: "include",
    headers,
  });

  return response;
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh()
      .catch((error: unknown) => {
        clearAccessToken();
        notifySessionExpired();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function performRefresh(): Promise<string> {
  const response = await fetch(API_BASE_URL + REFRESH_PATH, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  const result = (await response.json()) as AuthResponse;
  setAccessToken(result.accessToken);
  return result.accessToken;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await createApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

async function createApiError(response: Response): Promise<ApiError> {
  let message = "Request failed";
  let details: unknown = null;

  try {
    const body = (await response.json()) as {
      message?: string;
      error?: string;
    };
    details = body;
    message = body.message || body.error || message;
  } catch {
    message = await response.text();
  }

  return new ApiError(message || "Request failed", details);
}
