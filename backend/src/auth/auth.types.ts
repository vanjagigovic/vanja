export type AuthUser = {
  id: string;
  email: string;
};

export type AuthenticatedUser = {
  id: string;
};

export type JwtPayload = {
  sub: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type AuthSession = AuthResponse & {
  refreshToken: string;
};
