import { ParseUUIDPipe } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, jest } from '@jest/globals';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const user = { id: 'user-a' };
const eventId = '00000000-0000-0000-0000-000000000001';

describe('EventsController authorization boundary', () => {
  it('registers the JWT guard for the complete event controller', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      EventsController,
    ) as Array<new (...args: never[]) => unknown>;

    expect(guards).toContain(JwtAuthGuard);
  });

  it('rejects invalid event UUIDs with a bad-request error', async () => {
    await expect(
      new ParseUUIDPipe().transform('not-a-uuid', {
        type: 'param',
        data: 'id',
        metatype: String,
      }),
    ).rejects.toThrow('Validation failed (uuid is expected)');
  });

  it('passes the JWT user id to every event operation', async () => {
    const service = {
      findAll: jest.fn<(...args: never[]) => Promise<unknown>>(),
      findOne: jest.fn<(...args: never[]) => Promise<unknown>>(),
      create: jest.fn<(...args: never[]) => Promise<unknown>>(),
      update: jest.fn<(...args: never[]) => Promise<unknown>>(),
      remove: jest.fn<(...args: never[]) => Promise<unknown>>(),
    };
    const controller = new EventsController(
      service as unknown as EventsService,
    );
    const query = {};
    const createDto = {
      title: 'Event',
      startUtc: '2099-01-01T10:00:00.000Z',
      endUtc: '2099-01-01T11:00:00.000Z',
      timeZone: 'UTC',
      eventType: 'work' as const,
    };
    const updateDto = { title: 'Updated event' };

    await controller.findAll(query, user);
    await controller.findOne(eventId, user);
    await controller.create(createDto, user);
    await controller.update(eventId, updateDto, user);
    await controller.remove(eventId, user);

    expect(service.findAll).toHaveBeenCalledWith(user.id, query);
    expect(service.findOne).toHaveBeenCalledWith(user.id, eventId);
    expect(service.create).toHaveBeenCalledWith(user.id, createDto);
    expect(service.update).toHaveBeenCalledWith(user.id, eventId, updateDto);
    expect(service.remove).toHaveBeenCalledWith(user.id, eventId);
  });

  it('does not accept ownership from the create DTO', async () => {
    const service = {
      create: jest.fn<(...args: never[]) => Promise<unknown>>(),
    };
    const controller = new EventsController(
      service as unknown as EventsService,
    );
    const dto = {
      title: 'Event',
      startUtc: '2099-01-01T10:00:00.000Z',
      endUtc: '2099-01-01T11:00:00.000Z',
      timeZone: 'UTC',
      eventType: 'work' as const,
      userId: 'user-b',
    };

    await controller.create(dto, user);

    expect(service.create).toHaveBeenCalledWith(user.id, dto);
    expect(service.create.mock.calls[0][0]).not.toBe(dto.userId);
  });
});
