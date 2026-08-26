import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthProvider";

const authApiMock = vi.hoisted(() => ({
  refresh: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));
const registerListenerMock = vi.hoisted(() => vi.fn());

vi.mock("../api/auth-api", () => ({ authApi: authApiMock }));
vi.mock("../api/api-client", () => ({
  registerSessionExpiredListener: registerListenerMock,
}));

function AuthState() {
  const { status, user } = useAuth();
  return <output>{`${status}:${user?.email ?? "none"}`}</output>;
}

describe("AuthProvider session expiration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authApiMock.refresh.mockResolvedValue({
      user: { id: "user-id", email: "user@example.com" },
      accessToken: "access-token",
    });
    registerListenerMock.mockReturnValue(vi.fn());
  });

  it("clears the user and calendar cache when the session expires", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(["calendar-events"], [{ id: "event-id" }]);
    let sessionExpired: (() => void) | undefined;
    registerListenerMock.mockImplementation((listener: () => void) => {
      sessionExpired = listener;
      return vi.fn();
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthState />
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("authenticated:user@example.com")).toBeInTheDocument();
    expect(sessionExpired).toBeDefined();

    sessionExpired?.();

    await waitFor(() => {
      expect(screen.getByText("unauthenticated:none")).toBeInTheDocument();
      expect(queryClient.getQueryData(["calendar-events"])).toBeUndefined();
    });
    expect(authApiMock.logout).not.toHaveBeenCalled();
  });

  it("treats initial refresh failure as unauthenticated without notifying expiration", async () => {
    authApiMock.refresh.mockRejectedValue(new Error("No session"));

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <AuthState />
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("unauthenticated:none")).toBeInTheDocument();
    expect(registerListenerMock).toHaveBeenCalledTimes(1);
  });
});
