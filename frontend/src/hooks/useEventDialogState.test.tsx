import { act, renderHook } from '@testing-library/react';

import { ApiError } from '../api/api-client';
import type { CalendarEvent } from '../types/types';
import { useEventDialogState } from './useEventDialogState';
import { describe, it, expect, vi } from 'vitest';

describe('useEventDialogState', () => {
  const setup = (
    props: Partial<Parameters<typeof useEventDialogState>[0]> = {}
  ) => {
    const defaultProps = {
      event: null,
      initialStartUtc: undefined,
      initialEndUtc: undefined,
      onSave: vi.fn(),
    };

    return renderHook(() =>
      useEventDialogState({ ...defaultProps, ...props })
    );
  };

  it('blocks creating a new event in the past', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const pastStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const pastEnd = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { result } = setup({
      initialStartUtc: pastStart,
      initialEndUtc: pastEnd,
      onSave,
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault() {},
      } as React.FormEvent);
    });

    expect(result.current.fieldErrors.startLocal).toBe(
      'Start date cannot be in the past'
    );
    expect(result.current.error).toBe(
      'Start date cannot be in the past'
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it('stores overlap error details and suggested time from API errors', async () => {
    const onSave = vi.fn().mockRejectedValue(
      new ApiError('Event overlaps an existing booking', {
        suggestedTime: {
          startUtc: '2026-04-10T12:00:00.000Z',
          endUtc: '2026-04-10T13:00:00.000Z',
        },
      })
    );

    const futureStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { result } = setup({
      initialStartUtc: futureStart,
      initialEndUtc: futureEnd,
      onSave,
    });

    act(() => {
      result.current.setTitle('Planning session');
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault() {},
      } as React.FormEvent);
    });

    expect(result.current.error).toBe(
      'Event overlaps an existing booking'
    );
    expect(result.current.suggestion).toEqual({
      startUtc: '2026-04-10T12:00:00.000Z',
      endUtc: '2026-04-10T13:00:00.000Z',
    });
  });

  it('applies the suggested time into the dialog state without submitting', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const event: CalendarEvent = {
      id: '1',
      title: 'Existing event',
      startUtc: '2026-04-10T09:00:00.000Z',
      endUtc: '2026-04-10T10:00:00.000Z',
      timeZone: 'UTC',
      eventType: 'work',
      repeatWeekly: false,
      repeatUntilUtc: null,
      reminderEnabled: false,
      occurrenceId: '1',
      baseEventId: '1',
      reminderAtUtc: null,
    };

    const { result } = setup({
      event,
      onSave,
    });

    act(() => {
      const suggestion = {
        startUtc: '2026-04-10T15:00:00.000Z',
        endUtc: '2026-04-10T16:30:00.000Z',
      };

      result.current.setSuggestion(suggestion);
      result.current.applySuggestedTime(suggestion);
    });

    expect(result.current.startLocal).toBe('2026-04-10T15:00');
    expect(result.current.endLocal).toBe('2026-04-10T16:30');
    expect(result.current.suggestion).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('reports missing required fields before saving', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const futureStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { result } = setup({
      initialStartUtc: futureStart,
      initialEndUtc: futureEnd,
      onSave,
    });

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault() {},
      } as React.FormEvent);
    });

    expect(result.current.fieldErrors.title).toBe('Title is required');
    expect(result.current.error).toBe(
      'Please fill in all required fields'
    );
    expect(onSave).not.toHaveBeenCalled();
  });
});