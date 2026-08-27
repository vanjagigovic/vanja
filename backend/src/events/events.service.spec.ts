/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { describe, expect, it, jest } from '@jest/globals';
import { EventsService } from './events.service';

function collectColumnNames(
  value: unknown,
  names = new Set<string>(),
  seen = new Set<object>(),
) {
  if (!value || typeof value !== 'object') {
    return names;
  }

  if (seen.has(value)) {
    return names;
  }
  seen.add(value);

  for (const [key, child] of Object.entries(value)) {
    if (key === 'name' && typeof child === 'string') {
      names.add(child);
    }
    collectColumnNames(child, names, seen);
  }

  return names;
}

describe('EventsService ownership queries', () => {
  function makeCurrentEvent(overrides: Record<string, unknown> = {}) {
    return {
      id: 'event-id',
      title: 'Event',
      startUtc: new Date('2099-01-01T10:00:00.000Z'),
      endUtc: new Date('2099-01-01T11:00:00.000Z'),
      timeZone: 'UTC',
      eventType: 'work',
      repeatWeekly: true,
      repeatUntilUtc: new Date('2099-01-31T00:00:00.000Z'),
      reminderEnabled: false,
      ...overrides,
    };
  }

  async function updateAndGetValues(dto: Record<string, unknown>) {
    const currentEvent = makeCurrentEvent();
    let values: Record<string, unknown> | undefined;
    const db = {
      select: jest.fn().mockReturnValue({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([currentEvent]),
            orderBy: () => Promise.resolve([]),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: (nextValues: Record<string, unknown>) => {
          values = nextValues;
          return {
            where: () => ({ returning: () => Promise.resolve([currentEvent]) }),
          };
        },
      }),
    } as any;
    await new EventsService(db).update('user-a', 'event-id', dto as any);
    return values;
  }

  it('preserves the recurrence boundary when repeatUntilUtc is omitted', async () => {
    const values = await updateAndGetValues({ title: 'Updated event' });

    expect(values?.repeatUntilUtc).toEqual(
      new Date('2099-01-31T00:00:00.000Z'),
    );
  });

  it('clears the recurrence boundary when repeatUntilUtc is null', async () => {
    const values = await updateAndGetValues({
      repeatWeekly: false,
      repeatUntilUtc: null,
    });

    expect(values?.repeatUntilUtc).toBeNull();
  });

  it('stores a valid replacement recurrence boundary', async () => {
    const values = await updateAndGetValues({
      repeatUntilUtc: '2099-02-01T00:00:00.000Z',
    });

    expect(values?.repeatUntilUtc).toEqual(
      new Date('2099-02-01T00:00:00.000Z'),
    );
  });

  it('clears the boundary when recurrence is disabled without losing other fields', async () => {
    const values = await updateAndGetValues({
      repeatWeekly: false,
      title: 'Updated event',
    });

    expect(values).toMatchObject({
      title: 'Updated event',
      repeatWeekly: false,
      repeatUntilUtc: null,
    });
  });

  it('uses a half-open range when expanding occurrences', () => {
    const service = new EventsService({} as any) as any;
    const event = {
      id: 'event-id',
      title: 'Event',
      startUtc: '2099-01-01T10:00:00.000Z',
      endUtc: '2099-01-01T11:00:00.000Z',
      timeZone: 'UTC',
      eventType: 'work',
      repeatWeekly: false,
      repeatUntilUtc: null,
      reminderEnabled: false,
    };
    const expand = (start: string, end: string) =>
      service.generateOccurrencesFromShape(event, start, end);

    expect(
      expand('2099-01-01T09:00:00.000Z', '2099-01-01T10:00:00.000Z'),
    ).toHaveLength(0);
    expect(
      expand('2099-01-01T11:00:00.000Z', '2099-01-01T12:00:00.000Z'),
    ).toHaveLength(0);
    expect(
      expand('2099-01-01T10:30:00.000Z', '2099-01-01T11:30:00.000Z'),
    ).toHaveLength(1);
    expect(
      expand('2099-01-01T12:00:00.000Z', '2099-01-01T13:00:00.000Z'),
    ).toHaveLength(0);
  });

  it('adds the authenticated user id to unfiltered list queries', async () => {
    let wherePredicate: unknown;
    const db = {
      select: jest.fn().mockReturnValue({
        from: () => ({
          where: (predicate: unknown) => {
            wherePredicate = predicate;
            return { orderBy: () => Promise.resolve([]) };
          },
          orderBy: () => Promise.resolve([]),
        }),
      }),
    } as any;
    const service = new EventsService(db);

    await service.findAll('user-a');

    expect(collectColumnNames(wherePredicate)).toContain('user_id');
  });

  it('requires both event id and authenticated user id for detail queries', async () => {
    let wherePredicate: unknown;
    const db = {
      select: jest.fn().mockReturnValue({
        from: () => ({
          where: (predicate: unknown) => {
            wherePredicate = predicate;
            return { limit: () => Promise.resolve([]) };
          },
        }),
      }),
    } as any;
    const service = new EventsService(db);

    await expect(service.findOne('user-a', 'event-id')).rejects.toThrow(
      'Event not found',
    );

    const columns = collectColumnNames(wherePredicate);
    expect(columns).toContain('id');
    expect(columns).toContain('user_id');
  });

  it('scopes conflict lookup queries to the authenticated user', async () => {
    let wherePredicate: unknown;
    const db = {
      select: jest.fn().mockReturnValue({
        from: () => ({
          where: (predicate: unknown) => {
            wherePredicate = predicate;
            return { orderBy: () => Promise.resolve([]) };
          },
        }),
      }),
    } as any;
    const service = new EventsService(db);
    const startUtc = '2099-01-01T10:00:00.000Z';
    const endUtc = '2099-01-01T11:00:00.000Z';

    await service.findAll('user-a', {
      rangeStartUtc: startUtc,
      rangeEndUtc: endUtc,
    });

    expect(collectColumnNames(wherePredicate)).toContain('user_id');
  });

  it('adds the authenticated user id to update predicates', async () => {
    let updatePredicate: unknown;
    let selectCall = 0;
    const currentEvent = {
      id: 'event-id',
      title: 'Event',
      startUtc: new Date('2099-01-01T10:00:00.000Z'),
      endUtc: new Date('2099-01-01T11:00:00.000Z'),
      timeZone: 'UTC',
      eventType: 'work',
      repeatWeekly: false,
      repeatUntilUtc: null,
      reminderEnabled: false,
    };
    const db = {
      select: jest.fn().mockImplementation(() => ({
        from: () => ({
          where: () => {
            selectCall += 1;
            return selectCall === 1
              ? { limit: () => Promise.resolve([currentEvent]) }
              : { orderBy: () => Promise.resolve([]) };
          },
        }),
      })),
      update: jest.fn().mockReturnValue({
        set: () => ({
          where: (predicate: unknown) => {
            updatePredicate = predicate;
            return { returning: () => Promise.resolve([currentEvent]) };
          },
        }),
      }),
    } as any;
    const service = new EventsService(db);

    await service.update('user-a', 'event-id', { title: 'Updated event' });

    const columns = collectColumnNames(updatePredicate);
    expect(columns).toContain('id');
    expect(columns).toContain('user_id');
  });

  it('adds the authenticated user id to delete predicates', async () => {
    let deletePredicate: unknown;
    const currentEvent = {
      id: 'event-id',
      title: 'Event',
      startUtc: new Date('2099-01-01T10:00:00.000Z'),
      endUtc: new Date('2099-01-01T11:00:00.000Z'),
      timeZone: 'UTC',
      eventType: 'work',
      repeatWeekly: false,
      repeatUntilUtc: null,
      reminderEnabled: false,
    };
    const db = {
      select: jest.fn().mockReturnValue({
        from: () => ({
          where: () => ({ limit: () => Promise.resolve([currentEvent]) }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: (predicate: unknown) => {
          deletePredicate = predicate;
          return Promise.resolve();
        },
      }),
    } as any;
    const service = new EventsService(db);

    await service.remove('user-a', 'event-id');

    const columns = collectColumnNames(deletePredicate);
    expect(columns).toContain('id');
    expect(columns).toContain('user_id');
  });
});

describe('EventsService range queries', () => {
  function makeEvent(overrides: Record<string, unknown> = {}) {
    return {
      id: 'event-id',
      title: 'Event',
      startUtc: new Date('2099-01-05T10:00:00.000Z'),
      endUtc: new Date('2099-01-05T11:00:00.000Z'),
      timeZone: 'UTC',
      eventType: 'work',
      repeatWeekly: false,
      repeatUntilUtc: null,
      reminderEnabled: false,
      ...overrides,
    };
  }

  function serviceWithSelectedEvents(events: object[]) {
    const db = {
      select: jest.fn().mockReturnValue({
        from: () => ({
          where: () => ({
            orderBy: () => Promise.resolve(events),
          }),
        }),
      }),
    };

    return { service: new EventsService(db as never), db };
  }

  it('rejects a range when rangeStartUtc is missing', async () => {
    const { service } = serviceWithSelectedEvents([]);

    await expect(
      service.findAll('user-a', { rangeEndUtc: '2099-01-10T00:00:00.000Z' }),
    ).rejects.toThrow(
      'Both rangeStartUtc and rangeEndUtc are required when filtering by range',
    );
  });

  it('rejects a range when rangeEndUtc is missing', async () => {
    const { service } = serviceWithSelectedEvents([]);

    await expect(
      service.findAll('user-a', { rangeStartUtc: '2099-01-01T00:00:00.000Z' }),
    ).rejects.toThrow(
      'Both rangeStartUtc and rangeEndUtc are required when filtering by range',
    );
  });

  it('rejects invalid dates and ranges whose end precedes their start', async () => {
    const { service, db } = serviceWithSelectedEvents([]);

    await expect(
      service.findAll('user-a', {
        rangeStartUtc: 'not-a-date',
        rangeEndUtc: '2099-01-10T00:00:00.000Z',
      }),
    ).rejects.toThrow('Invalid event date');

    await expect(
      service.findAll('user-a', {
        rangeStartUtc: '2099-01-10T00:00:00.000Z',
        rangeEndUtc: '2099-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow('End time must be after start time');
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns a non-recurring event that overlaps the requested range', async () => {
    const { service } = serviceWithSelectedEvents([
      makeEvent({
        startUtc: new Date('2099-01-05T09:30:00.000Z'),
        endUtc: new Date('2099-01-05T10:30:00.000Z'),
      }),
    ]);

    const result = await service.findAll('user-a', {
      rangeStartUtc: '2099-01-05T10:00:00.000Z',
      rangeEndUtc: '2099-01-05T11:00:00.000Z',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'event-id',
      occurrenceId: 'event-id:2099-01-05T09:30:00.000Z',
      startUtc: '2099-01-05T09:30:00.000Z',
      endUtc: '2099-01-05T10:30:00.000Z',
    });
  });

  it('excludes a non-recurring event outside the requested range', async () => {
    const { service } = serviceWithSelectedEvents([
      makeEvent({
        startUtc: new Date('2099-01-06T10:00:00.000Z'),
        endUtc: new Date('2099-01-06T11:00:00.000Z'),
      }),
    ]);

    const result = await service.findAll('user-a', {
      rangeStartUtc: '2099-01-05T10:00:00.000Z',
      rangeEndUtc: '2099-01-05T11:00:00.000Z',
    });

    expect(result).toEqual([]);
  });

  it('expands a recurring weekly event into occurrences inside the range', async () => {
    const { service } = serviceWithSelectedEvents([
      makeEvent({
        repeatWeekly: true,
        repeatUntilUtc: new Date('2099-01-26T00:00:00.000Z'),
      }),
    ]);

    const result = await service.findAll('user-a', {
      rangeStartUtc: '2099-01-01T00:00:00.000Z',
      rangeEndUtc: '2099-02-02T00:00:00.000Z',
    });

    expect(result).toHaveLength(4);
    expect(result.map((occurrence) => occurrence.startUtc)).toEqual([
      '2099-01-05T10:00:00.000Z',
      '2099-01-12T10:00:00.000Z',
      '2099-01-19T10:00:00.000Z',
      '2099-01-26T10:00:00.000Z',
    ]);
    expect(
      result.every((occurrence) => occurrence.endUtc.endsWith('11:00:00.000Z')),
    ).toBe(true);
  });

  it('excludes recurring occurrences after the repeat-until boundary', async () => {
    const { service } = serviceWithSelectedEvents([
      makeEvent({
        repeatWeekly: true,
        repeatUntilUtc: new Date('2099-01-12T00:00:00.000Z'),
      }),
    ]);

    const result = await service.findAll('user-a', {
      rangeStartUtc: '2099-01-13T00:00:00.000Z',
      rangeEndUtc: '2099-01-20T00:00:00.000Z',
    });

    expect(result).toEqual([]);
  });

  it('excludes the current event from update conflict lookup', async () => {
    let conflictPredicate: unknown;
    let selectCall = 0;
    const currentEvent = makeEvent();
    const db = {
      select: jest.fn().mockReturnValue({
        from: () => ({
          where: (predicate: unknown) => {
            selectCall += 1;

            if (selectCall === 1) {
              return { limit: () => Promise.resolve([currentEvent]) };
            }

            conflictPredicate = predicate;
            return { orderBy: () => Promise.resolve([]) };
          },
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: () => ({
          where: () => ({ returning: () => Promise.resolve([currentEvent]) }),
        }),
      }),
    };

    await new EventsService(db as never).update('user-a', 'event-id', {
      title: 'Updated event',
    });

    expect(collectColumnNames(conflictPredicate)).toContain('id');
    expect(collectColumnNames(conflictPredicate)).toContain('user_id');
  });
});
