import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function AuthActions() {
  const { status, user, login, register, logout } = useAuth();

  return (
    <>
      <output>{`${status}:${user?.email ?? "none"}`}</output>
      <button onClick={() => void login({ email: "login@example.com", password: "password" })}>
        Login
      </button>
      <button onClick={() => void register({ email: "register@example.com", password: "password" })}>
        Register
      </button>
      <button onClick={() => void logout().catch(() => undefined)}>Logout</button>
    </>
  );
}

function renderWithAuth(children: React.ReactNode, queryClient = new QueryClient()) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>,
    ),
  };
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

    renderWithAuth(<AuthState />, queryClient);

    expect(await screen.findByText("authenticated:user@example.com")).toBeInTheDocument();
    expect(sessionExpired).toBeDefined();

    act(() => {
      sessionExpired?.();
    });

    await waitFor(() => {
      expect(screen.getByText("unauthenticated:none")).toBeInTheDocument();
      expect(queryClient.getQueryData(["calendar-events"])).toBeUndefined();
    });
    expect(authApiMock.logout).not.toHaveBeenCalled();
  });

  it("treats initial refresh failure as unauthenticated without notifying expiration", async () => {
    authApiMock.refresh.mockRejectedValue(new Error("No session"));

    renderWithAuth(<AuthState />);

    expect(await screen.findByText("unauthenticated:none")).toBeInTheDocument();
    expect(registerListenerMock).toHaveBeenCalledTimes(1);
  });

  it("applies a session returned by login", async () => {
    const user = userEvent.setup();
    authApiMock.login.mockResolvedValue({
      user: { id: "login-user", email: "login@example.com" },
      accessToken: "login-token",
    });

    renderWithAuth(<AuthActions />);
    await screen.findByText("authenticated:user@example.com");

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("authenticated:login@example.com")).toBeInTheDocument();
    expect(authApiMock.login).toHaveBeenCalledWith({
      email: "login@example.com",
      password: "password",
    });
  });

  it("applies a session returned by registration", async () => {
    const user = userEvent.setup();
    authApiMock.register.mockResolvedValue({
      user: { id: "registered-user", email: "register@example.com" },
      accessToken: "register-token",
    });

    renderWithAuth(<AuthActions />);
    await screen.findByText("authenticated:user@example.com");

    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("authenticated:register@example.com")).toBeInTheDocument();
    expect(authApiMock.register).toHaveBeenCalledWith({
      email: "register@example.com",
      password: "password",
    });
  });

  it("clears the session and calendar cache after logout", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    queryClient.setQueryData(["calendar-events", "today"], [{ id: "event-id" }]);

    renderWithAuth(<AuthActions />, queryClient);
    await screen.findByText("authenticated:user@example.com");

    await user.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByText("unauthenticated:none")).toBeInTheDocument();
      expect(queryClient.getQueryData(["calendar-events", "today"])).toBeUndefined();
    });
    expect(authApiMock.logout).toHaveBeenCalledOnce();
  });

  it("clears the session and cache even when logout fails", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient();
    queryClient.setQueryData(["calendar-events", "today"], [{ id: "event-id" }]);
    authApiMock.logout.mockRejectedValue(new Error("Logout failed"));

    renderWithAuth(<AuthActions />, queryClient);
    await screen.findByText("authenticated:user@example.com");

    await user.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByText("unauthenticated:none")).toBeInTheDocument();
      expect(queryClient.getQueryData(["calendar-events", "today"])).toBeUndefined();
    });
  });

  it("ignores a session restore that resolves after unmount", async () => {
    let resolveRefresh: ((value: { user: { id: string; email: string }; accessToken: string }) => void) | undefined;
    authApiMock.refresh.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    const unregister = vi.fn();
    registerListenerMock.mockReturnValue(unregister);

    const { unmount } = renderWithAuth(<AuthState />);
    unmount();

    await act(async () => {
      resolveRefresh?.({
        user: { id: "late-user", email: "late@example.com" },
        accessToken: "late-token",
      });
    });

    expect(unregister).toHaveBeenCalledOnce();
  });

  it("shares an in-flight session restore between providers", async () => {
    let resolveRefresh: ((value: { user: { id: string; email: string }; accessToken: string }) => void) | undefined;
    authApiMock.refresh.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    const first = renderWithAuth(<AuthState />);
    const second = renderWithAuth(<AuthState />);

    expect(authApiMock.refresh).toHaveBeenCalledOnce();

    await act(async () => {
      resolveRefresh?.({
        user: { id: "shared-user", email: "shared@example.com" },
        accessToken: "shared-token",
      });
    });

    expect(first.container.querySelector("output")?.textContent).toBe(
      "authenticated:shared@example.com",
    );
    expect(second.container.querySelector("output")?.textContent).toBe(
      "authenticated:shared@example.com",
    );
    first.unmount();
    second.unmount();
  });

  it("ignores a failed session restore after unmount", async () => {
    let rejectRefresh: ((reason?: unknown) => void) | undefined;
    authApiMock.refresh.mockReturnValue(
      new Promise((_, reject) => {
        rejectRefresh = reject;
      }),
    );
    const { unmount } = renderWithAuth(<AuthState />);
    unmount();

    await act(async () => {
      rejectRefresh?.(new Error("Late restore failure"));
    });

    expect(registerListenerMock).toHaveBeenCalledOnce();
  });

  it("requires useAuth to be called inside AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within an AuthProvider",
    );
  });
});
