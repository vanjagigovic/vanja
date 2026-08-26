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
