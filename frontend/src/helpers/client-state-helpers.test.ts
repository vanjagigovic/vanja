import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../api/api-client";
import {
  getApiErrorState,
  getErrorMessage,
  runAsyncAction,
} from "./client-state-helpers";

describe("client state helpers", () => {
  describe("getErrorMessage", () => {
    it("returns an Error message and falls back for non-Errors", () => {
      expect(getErrorMessage(new Error("Could not load events"), "Load failed")).toBe(
        "Could not load events",
      );
      expect(getErrorMessage({ reason: "offline" }, "Load failed")).toBe(
        "Load failed",
      );
    });
  });

  describe("getApiErrorState", () => {
    it("preserves an ApiError message and suggested time details", () => {
      const suggestedTime = {
        startUtc: "2026-04-10T12:00:00.000Z",
        endUtc: "2026-04-10T13:00:00.000Z",
      };

      expect(
        getApiErrorState(
          new ApiError("Event overlaps an existing booking", { suggestedTime }),
        ),
      ).toEqual({
        message: "Event overlaps an existing booking",
        suggestedTime,
      });
    });

    it("returns the generic fallback for an unknown failure", () => {
      expect(getApiErrorState({ status: 503 })).toEqual({
        message: "Request faild",
        suggestedTime: null,
      });
    });
  });

  describe("runAsyncAction", () => {
    it("clears the previous error, marks saving, and returns true on success", async () => {
      const action = vi.fn().mockResolvedValue(undefined);
      const setError = vi.fn();
      const setSaving = vi.fn();

      await expect(
        runAsyncAction({
          action,
          setError,
          setSaving,
          fallbackMessage: "Save failed",
        }),
      ).resolves.toBe(true);

      expect(action).toHaveBeenCalledOnce();
      expect(setSaving).toHaveBeenCalledWith(true);
      expect(setError).toHaveBeenCalledWith("");
    });

    it("uses the fallback for a non-Error failure, resets saving, and reports the error", async () => {
      const failure = { code: "NETWORK_OFFLINE" };
      const action = vi.fn().mockRejectedValue(failure);
      const setError = vi.fn();
      const setSaving = vi.fn();
      const onError = vi.fn();

      await expect(
        runAsyncAction({
          action,
          setError,
          setSaving,
          fallbackMessage: "Save failed",
          onError,
        }),
      ).resolves.toBe(false);

      expect(setSaving).toHaveBeenNthCalledWith(1, true);
      expect(setSaving).toHaveBeenNthCalledWith(2, false);
      expect(setError).toHaveBeenNthCalledWith(1, "");
      expect(setError).toHaveBeenNthCalledWith(2, "Save failed");
      expect(onError).toHaveBeenCalledWith(failure);
    });

    it("uses an Error message when an action fails", async () => {
      const action = vi.fn().mockRejectedValue(new Error("Delete failed"));
      const setError = vi.fn();

      await expect(
        runAsyncAction({
          action,
          setError,
          fallbackMessage: "Delete failed unexpectedly",
        }),
      ).resolves.toBe(false);

      expect(setError).toHaveBeenLastCalledWith("Delete failed");
    });
  });
});
