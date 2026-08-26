import { apiRequest } from "./api-client";
import type { AuthResponse } from "../auth/auth-types";

type AuthCredentials = {
  email: string;
  password: string;
};

type LogoutResponse = {
  success: boolean;
};

const authRequestOptions: RequestInit = {
  credentials: "include",
};

export const authApi = {
  login: (credentials: AuthCredentials) =>
    apiRequest<AuthResponse>("/auth/login", {
      ...authRequestOptions,
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (credentials: AuthCredentials) =>
    apiRequest<AuthResponse>("/auth/register", {
      ...authRequestOptions,
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  refresh: () =>
    apiRequest<AuthResponse>("/auth/refresh", {
      ...authRequestOptions,
      method: "POST",
    }),

  logout: () =>
    apiRequest<LogoutResponse>("/auth/logout", {
      ...authRequestOptions,
      method: "POST",
    }),
};
