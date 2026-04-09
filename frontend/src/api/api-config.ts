export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3001';

export function getApiBaseUrl(): string{
  return   import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
}

