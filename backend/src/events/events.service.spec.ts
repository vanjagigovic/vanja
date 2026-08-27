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
