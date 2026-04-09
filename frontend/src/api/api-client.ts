import { getApiBaseUrl } from "./api-config";

const API_BASE_URL = getApiBaseUrl();

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
  const response = await fetch(API_BASE_URL + path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = "Request failed";
    let details: unknown = null;
    try {
      const body = await response.json();
      details = body;
      message = body.message || body.error || message;
    } catch {
      message = await response.text();
    }
    throw new ApiError(message || "Request failed", details);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
