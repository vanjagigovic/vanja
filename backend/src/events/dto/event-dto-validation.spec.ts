import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from '@jest/globals';
import { CreateEventDto } from './create-event-dto';
import { UpdateEventDto } from './update-event-dto';

describe('event DTO validation', () => {
  it('rejects whitespace-only titles and time zones', async () => {
    const dto = plainToInstance(CreateEventDto, {
      title: '   ',
      startUtc: '2099-01-01T10:00:00.000Z',
      endUtc: '2099-01-01T11:00:00.000Z',
      timeZone: '   ',
      eventType: 'work',
    });

    const errors = await validate(dto);
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );

    expect(messages).toEqual(
      expect.arrayContaining([
        'title should not be empty',
        'timeZone should not be empty',
      ]),
    );
  });

  it('accepts an explicit null recurrence boundary on updates', async () => {
    const dto = plainToInstance(UpdateEventDto, { repeatUntilUtc: null });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
