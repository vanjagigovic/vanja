import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, gte, lte, ne, or } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../db/db.module';
import { EventRecord, eventsTable } from '../db/schema';
import { CreateEventDto } from './dto/create-event-dto';
import { ListEventDto } from './dto/list-event-dto';
import { UpdateEventDto } from './dto/update-event-dto';
import {
  EventOccurrenceResponseDto,
  EventResponseDto,
} from './dto/event-response-dto';

type MutableEventShape = {
  id: string;
  title: string;
  startUtc: string;
  endUtc: string;
  timeZone: string;
  eventType: string;
  repeatWeekly: boolean;
  repeatUntilUtc?: string | null;
  reminderEnabled: boolean;
};

type EventOccurrence = MutableEventShape & {
  occurrenceId: string;
  baseEventId: string;
  reminderAtUtc: string | null;
};

@Injectable()
export class EventsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async findAll(userId: string, query: ListEventDto = {}) {
    if (!query.rangeStartUtc && !query.rangeEndUtc) {
      const events = await this.db
        .select()
        .from(eventsTable)
        .where(eq(eventsTable.userId, userId))
        .orderBy(asc(eventsTable.startUtc));

      return events.map((event) =>
        this.toOccurrenceResponse(this.toSingleOccurrence(event)),
      );
    }

    if (!query.rangeStartUtc || !query.rangeEndUtc) {
      throw new BadRequestException(
        'Both rangeStartUtc and rangeEndUtc are required when filtering by range',
      );
    }

    this.validateDateRange(query.rangeStartUtc, query.rangeEndUtc);

    const events = await this.getEventsForRange(
      userId,
      query.rangeStartUtc,
      query.rangeEndUtc,
    );

    return events.flatMap((event) =>
      this.generateOccurrences(
        event,
        query.rangeStartUtc as string,
        query.rangeEndUtc as string,
      ).map((occurrence) => this.toOccurrenceResponse(occurrence)),
    );
  }

  async findOne(userId: string, id: string) {
    const [event] = await this.db
      .select()
      .from(eventsTable)
      .where(and(eq(eventsTable.id, id), eq(eventsTable.userId, userId)))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.toEventResponse(event);
  }

  async create(userId: string, createEventDto: CreateEventDto) {
    const candidate = this.normalizeCandidate({
      id: 'draft',
      title: createEventDto.title,
      startUtc: createEventDto.startUtc,
      endUtc: createEventDto.endUtc,
      timeZone: createEventDto.timeZone,
      eventType: createEventDto.eventType,
      repeatWeekly: createEventDto.repeatWeekly ?? false,
      repeatUntilUtc: createEventDto.repeatUntilUtc ?? null,
      reminderEnabled: createEventDto.reminderEnabled ?? false,
    });

    this.validateNotInPast(candidate.startUtc);

    await this.ensureNoOverlap(userId, candidate);

    const [created] = await this.db
      .insert(eventsTable)
      .values({
        userId,
        title: candidate.title,
        startUtc: new Date(candidate.startUtc),
        endUtc: new Date(candidate.endUtc),
        timeZone: candidate.timeZone,
        eventType: candidate.eventType,
        repeatWeekly: candidate.repeatWeekly,
        repeatUntilUtc: candidate.repeatUntilUtc
          ? new Date(candidate.repeatUntilUtc)
          : null,
        reminderEnabled: candidate.reminderEnabled,
      })
      .returning();

    return this.toEventResponse(created);
  }

  async update(userId: string, id: string, updateEventDto: UpdateEventDto) {
    const current = await this.findOne(userId, id);

    const candidate = this.normalizeCandidate({
      id,
      title: updateEventDto.title ?? current.title,
      startUtc: updateEventDto.startUtc ?? current.startUtc,
      endUtc: updateEventDto.endUtc ?? current.endUtc,
      timeZone: updateEventDto.timeZone ?? current.timeZone,
      eventType: updateEventDto.eventType ?? current.eventType,
      repeatWeekly: updateEventDto.repeatWeekly ?? current.repeatWeekly,
      repeatUntilUtc:
        updateEventDto.repeatUntilUtc ?? current.repeatUntilUtc ?? null,
      reminderEnabled:
        updateEventDto.reminderEnabled ?? current.reminderEnabled,
    });

    await this.ensureNoOverlap(userId, candidate, id);

    const [updated] = await this.db
      .update(eventsTable)
      .set({
        title: candidate.title,
        startUtc: new Date(candidate.startUtc),
        endUtc: new Date(candidate.endUtc),
        timeZone: candidate.timeZone,
        eventType: candidate.eventType,
        repeatWeekly: candidate.repeatWeekly,
        repeatUntilUtc: candidate.repeatUntilUtc
          ? new Date(candidate.repeatUntilUtc)
          : null,
        reminderEnabled: candidate.reminderEnabled,
        updatedAt: new Date(),
      })
      .where(and(eq(eventsTable.id, id), eq(eventsTable.userId, userId)))
      .returning();

    return updated ? this.toEventResponse(updated) : undefined;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.db
      .delete(eventsTable)
      .where(and(eq(eventsTable.id, id), eq(eventsTable.userId, userId)));

    return { success: true };
  }

  private normalizeCandidate(candidate: MutableEventShape): MutableEventShape {
    const normalized = {
      ...candidate,
      title: candidate.title.trim(),
      timeZone: candidate.timeZone.trim(),
      eventType: candidate.eventType.trim(),
      repeatUntilUtc: candidate.repeatUntilUtc ?? null,
    };

    this.validateDateRange(normalized.startUtc, normalized.endUtc);
    this.validateRepeatRule(normalized);

    return normalized;
  }

  private validateDateRange(startUtc: string, endUtc: string) {
    const start = new Date(startUtc).getTime();
    const end = new Date(endUtc).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      throw new BadRequestException('Invalid event date');
    }

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  private validateNotInPast(startUtc: string) {
    if (new Date(startUtc).getTime() < Date.now()) {
      throw new BadRequestException('Events cannot be created in the past');
    }
  }

  private validateRepeatRule(candidate: MutableEventShape) {
    if (!candidate.repeatWeekly) {
      return;
    }

    if (!candidate.repeatUntilUtc) {
      throw new BadRequestException(
        'Repeat-until date is required for weekly recurrence',
      );
    }

    if (
      new Date(candidate.repeatUntilUtc).getTime() <
      new Date(candidate.startUtc).getTime()
    ) {
      throw new BadRequestException(
        'Repeat-until date must be on or after the first event occurrence',
      );
    }
  }

  private async ensureNoOverlap(
    userId: string,
    candidate: MutableEventShape,
    excludedId?: string,
  ) {
    const comparisonBounds = this.getComparisonBounds(candidate);

    const events = await this.getEventsForRange(
      userId,
      comparisonBounds.startUtc,
      comparisonBounds.endUtc,
      excludedId,
    );

    const conflict = this.findConflict(candidate, events);

    if (!conflict) {
      return;
    }

    const suggestion = this.findSuggestedTime(candidate, events);

    throw new BadRequestException({
      message: 'Event overlaps an existing booking',
      conflict: {
        eventId: conflict.baseEventId,
        occurrenceStartUtc: conflict.startUtc,
        occurrenceEndUtc: conflict.endUtc,
        title: conflict.title,
      },
      suggestedTime: suggestion,
    });
  }

  private async getEventsForRange(
    userId: string,
    rangeStartUtc: string,
    rangeEndUtc: string,
    excludedId?: string,
  ) {
    const rangeStart = new Date(rangeStartUtc);
    const rangeEnd = new Date(rangeEndUtc);

    const rangeStartDateTime = DateTime.fromJSDate(rangeStart, { zone: 'utc' });

    const predicates = [
      eq(eventsTable.userId, userId),
      or(
        and(
          eq(eventsTable.repeatWeekly, false),
          lte(eventsTable.startUtc, rangeEnd),
          gte(eventsTable.endUtc, rangeStart),
        ),
        and(
          eq(eventsTable.repeatWeekly, true),
          lte(eventsTable.startUtc, rangeEnd),
        ),
      ),
    ];

    if (excludedId) {
      predicates.push(ne(eventsTable.id, excludedId));
    }

    const events = await this.db
      .select()
      .from(eventsTable)
      .where(and(...predicates))
      .orderBy(asc(eventsTable.startUtc));

    return events.filter((event) => {
      if (!event.repeatWeekly) {
        return event.endUtc >= rangeStart;
      }

      return (
        this.getSeriesEnd(this.mapRecordToShape(event)) >= rangeStartDateTime
      );
    });
  }

  private findConflict(
    candidate: MutableEventShape,
    events: EventRecord[],
  ): EventOccurrence | null {
    const comparisonBounds = this.getComparisonBounds(candidate, events);

    const candidateOccurrences = this.generateOccurrencesFromShape(
      candidate,
      comparisonBounds.startUtc,
      comparisonBounds.endUtc,
    );

    for (const event of events) {
      const existingOccurrences = this.generateOccurrences(
        event,
        comparisonBounds.startUtc,
        comparisonBounds.endUtc,
      );

      for (const candidateOccurrence of candidateOccurrences) {
        for (const existingOccurrence of existingOccurrences) {
          if (
            this.occurrencesOverlap(candidateOccurrence, existingOccurrence)
          ) {
            return existingOccurrence;
          }
        }
      }
    }

    return null;
  }

  private findSuggestedTime(
    candidate: MutableEventShape,
    events: EventRecord[],
  ) {
    const originalStart = DateTime.fromISO(candidate.startUtc, { zone: 'utc' });

    const originalEnd = DateTime.fromISO(candidate.endUtc, { zone: 'utc' });

    const durationMinutes = Math.round(
      originalEnd.diff(originalStart, 'minutes').minutes,
    );

    let shiftedStart = originalStart;
    let shiftedEnd = originalEnd;

    let shiftedRepeatUntil = candidate.repeatUntilUtc
      ? DateTime.fromISO(candidate.repeatUntilUtc, {
          zone: 'utc',
        })
      : null;

    for (let attempt = 0; attempt < 64; attempt += 1) {
      const shiftedCandidate = this.normalizeCandidate({
        ...candidate,
        startUtc: shiftedStart.toISO() as string,
        endUtc: shiftedEnd.toISO() as string,
        repeatUntilUtc: shiftedRepeatUntil?.toISO() ?? null,
      });

      const conflict = this.findConflict(shiftedCandidate, events);

      if (!conflict) {
        return {
          startUtc: shiftedCandidate.startUtc,
          endUtc: shiftedCandidate.endUtc,
        };
      }

      const conflictEnd = DateTime.fromISO(conflict.endUtc, { zone: 'utc' });

      const minutesToMove = Math.max(
        30,
        Math.ceil(conflictEnd.diff(shiftedStart, 'minutes').minutes / 30) * 30,
      );

      shiftedStart = shiftedStart.plus({
        minutes: minutesToMove,
      });

      shiftedEnd = shiftedStart.plus({
        minutes: durationMinutes,
      });

      shiftedRepeatUntil = shiftedRepeatUntil
        ? shiftedRepeatUntil.plus({
            minutes: minutesToMove,
          })
        : null;
    }

    return null;
  }

  private getComparisonBounds(
    candidate: MutableEventShape,
    events: EventRecord[] = [],
  ) {
    const starts = [
      new Date(candidate.startUtc).getTime(),
      ...events.map((event) => event.startUtc.getTime()),
    ];

    const ends = [
      this.getSeriesEnd(candidate).toMillis(),
      ...events.map((event) =>
        this.getSeriesEnd(this.mapRecordToShape(event)).toMillis(),
      ),
    ];

    return {
      startUtc: new Date(Math.min(...starts)).toISOString(),
      endUtc: new Date(Math.max(...ends)).toISOString(),
    };
  }

  private getSeriesEnd(event: MutableEventShape) {
    if (!event.repeatWeekly || !event.repeatUntilUtc) {
      return DateTime.fromISO(event.endUtc, {
        zone: 'utc',
      });
    }

    return this.getRepeatUntilBoundaryUtc(event);
  }

  private getRepeatUntilBoundaryUtc(event: MutableEventShape) {
    const repeatUntilLocal = DateTime.fromISO(event.repeatUntilUtc as string, {
      zone: 'utc',
    }).setZone(event.timeZone);

    return repeatUntilLocal.endOf('day').toUTC();
  }

  private generateOccurrences(
    event: EventRecord,
    rangeStartUtc: string,
    rangeEndUtc: string,
  ): EventOccurrence[] {
    return this.generateOccurrencesFromShape(
      this.mapRecordToShape(event),
      rangeStartUtc,
      rangeEndUtc,
    );
  }

  private generateOccurrencesFromShape(
    event: MutableEventShape,
    rangeStartUtc: string,
    rangeEndUtc: string,
  ): EventOccurrence[] {
    const rangeStart = DateTime.fromISO(rangeStartUtc, {
      zone: 'utc',
    });

    const rangeEnd = DateTime.fromISO(rangeEndUtc, {
      zone: 'utc',
    });

    const eventStartUtc = DateTime.fromISO(event.startUtc, { zone: 'utc' });

    const eventEndUtc = DateTime.fromISO(event.endUtc, { zone: 'utc' });

    const duration = eventEndUtc.diff(eventStartUtc);

    if (!event.repeatWeekly) {
      if (eventStartUtc < rangeEnd && eventEndUtc > rangeStart) {
        return [this.createOccurrence(event, eventStartUtc, eventEndUtc)];
      }

      return [];
    }

    const seriesEndUtc = this.getSeriesEnd(event);

    const eventStartLocal = eventStartUtc.setZone(event.timeZone);

    const rangeStartLocal = rangeStart.setZone(event.timeZone);

    let occurrenceStartLocal = eventStartLocal;

    if (rangeStartLocal > eventStartLocal) {
      const weeksToSkip = Math.max(
        0,
        Math.floor(rangeStartLocal.diff(eventStartLocal, 'weeks').weeks),
      );

      occurrenceStartLocal = eventStartLocal.plus({
        weeks: weeksToSkip,
      });

      while (occurrenceStartLocal.plus(duration).toUTC() <= rangeStart) {
        occurrenceStartLocal = occurrenceStartLocal.plus({ weeks: 1 });
      }
    }

    const occurrences: EventOccurrence[] = [];

    while (occurrenceStartLocal.toUTC() <= seriesEndUtc) {
      const occurrenceStartUtc = occurrenceStartLocal.toUTC();

      const occurrenceEndUtc = occurrenceStartUtc.plus(duration);

      if (occurrenceStartUtc >= rangeEnd) {
        break;
      }

      if (occurrenceStartUtc < rangeEnd && occurrenceEndUtc > rangeStart) {
        occurrences.push(
          this.createOccurrence(event, occurrenceStartUtc, occurrenceEndUtc),
        );
      }

      occurrenceStartLocal = occurrenceStartLocal.plus({ weeks: 1 });
    }

    return occurrences;
  }

  private createOccurrence(
    event: MutableEventShape,
    occurrenceStartUtc: DateTime,
    occurrenceEndUtc: DateTime,
  ): EventOccurrence {
    const reminderAtUtc = event.reminderEnabled
      ? occurrenceStartUtc.minus({ minutes: 10 }).toISO()
      : null;

    return {
      ...event,
      startUtc: occurrenceStartUtc.toISO() as string,
      endUtc: occurrenceEndUtc.toISO() as string,
      occurrenceId: `${event.id}:${occurrenceStartUtc.toISO()}`,
      baseEventId: event.id,
      reminderAtUtc,
    };
  }

  private toSingleOccurrence(event: EventRecord): EventOccurrence {
    return this.createOccurrence(
      this.mapRecordToShape(event),
      DateTime.fromJSDate(event.startUtc, {
        zone: 'utc',
      }),
      DateTime.fromJSDate(event.endUtc, {
        zone: 'utc',
      }),
    );
  }

  private toEventResponse(event: EventRecord): EventResponseDto {
    return {
      id: event.id,
      title: event.title,
      startUtc: event.startUtc.toISOString(),
      endUtc: event.endUtc.toISOString(),
      timeZone: event.timeZone,
      eventType: event.eventType as EventResponseDto['eventType'],
      repeatWeekly: event.repeatWeekly,
      repeatUntilUtc: event.repeatUntilUtc?.toISOString() ?? null,
      reminderEnabled: event.reminderEnabled,
    };
  }

  private toOccurrenceResponse(
    occurrence: EventOccurrence,
  ): EventOccurrenceResponseDto {
    return {
      ...occurrence,
      eventType: occurrence.eventType as EventResponseDto['eventType'],
      repeatUntilUtc: occurrence.repeatUntilUtc ?? null,
    };
  }

  private mapRecordToShape(event: EventRecord): MutableEventShape {
    return {
      id: event.id,
      title: event.title,
      startUtc: event.startUtc.toISOString(),
      endUtc: event.endUtc.toISOString(),
      timeZone: event.timeZone,
      eventType: event.eventType,
      repeatWeekly: event.repeatWeekly,
      repeatUntilUtc: event.repeatUntilUtc?.toISOString() ?? null,
      reminderEnabled: event.reminderEnabled,
    };
  }

  private occurrencesOverlap(left: EventOccurrence, right: EventOccurrence) {
    return (
      new Date(left.startUtc).getTime() < new Date(right.endUtc).getTime() &&
      new Date(left.endUtc).getTime() > new Date(right.startUtc).getTime()
    );
  }
}
