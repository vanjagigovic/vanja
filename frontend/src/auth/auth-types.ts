export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  accessToken: string;
}

export type AuthStatus =
  | "restoring"
  | "authenticated"
  | "unauthenticated";
