import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiRequest,
  registerSessionExpiredListener,
} from "./api-client";
import {
  clearAccessToken,
  setAccessToken,
} from "../auth/auth-token-store";

function response(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequest session expiration", () => {
  beforeEach(() => {
    clearAccessToken();
    vi.restoreAllMocks();
  });

  it("refreshes once and retries a request after a 401", async () => {
    setAccessToken("expired-token");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(401, { message: "Expired" }))
      .mockResolvedValueOnce(
        response(200, {
          user: { id: "user-id", email: "user@example.com" },
          accessToken: "new-token",
        }),
      )
      .mockResolvedValueOnce(response(200, { result: "ok" }));
    const listener = vi.fn();
    const unregister = registerSessionExpiredListener(listener);

    await expect(apiRequest<{ result: string }>("/events")).resolves.toEqual({
      result: "ok",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/auth/refresh");
    expect(fetchMock.mock.calls[2][0]).toContain("/events");
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      credentials: "include",
    });
    expect(listener).not.toHaveBeenCalled();
    unregister();
  });

  it("clears the token and notifies listeners once when refresh fails concurrently", async () => {
    setAccessToken("expired-token");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(401, { message: "Expired" }))
      .mockResolvedValueOnce(response(401, { message: "Expired" }))
      .mockResolvedValueOnce(response(401, { message: "Invalid refresh" }));
    const listener = vi.fn();
    const unregister = registerSessionExpiredListener(listener);

    const results = await Promise.allSettled([
      apiRequest("/events/one"),
      apiRequest("/events/two"),
    ]);

    expect(results.every((result) => result.status === "rejected")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(clearAccessToken).not.toThrow();
    expect((await import("../auth/auth-token-store")).getAccessToken()).toBeNull();
    unregister();
  });

  it("does not refresh recursively when the refresh endpoint returns 401", async () => {
    setAccessToken("expired-token");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(401, { message: "Invalid refresh" }));
    const listener = vi.fn();
    const unregister = registerSessionExpiredListener(listener);

    await expect(apiRequest("/auth/refresh")).rejects.toBeDefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(listener).not.toHaveBeenCalled();
    unregister();
  });

  it("normalizes validation message arrays while preserving error details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      response(400, { message: ["title should not be empty", "email is invalid"] }),
    );

    await expect(apiRequest("/events", { method: "POST" })).rejects.toMatchObject({
      message: "title should not be empty; email is invalid",
      details: {
        message: ["title should not be empty", "email is invalid"],
      },
    });
  });
});
