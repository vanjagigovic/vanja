import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../db/db.module';
import { CreateEventDto } from './dto/create-event-dto';
import { UpdateEventDto } from './dto/update-event-dto';
import { eq, asc, ne, and, gte, or, lte } from 'drizzle-orm';
import { ListEventDto } from './dto/list-event-dto';
import { DateTime } from 'luxon';
import { eventsTable, EventRecord } from '../db/schema';

type MutableEventShape = {
  id: string;
  title: string;
  startUtc: string;
  endUtc: string;
  timeZone: string;
  eventType: string;
  repeatWeekly: boolean;
  repeatUntilUtc: string | null;
  reminderEnabled: boolean;
};

type EventOccurrence = MutableEventShape & {
  occurenceId: string;
  baseEventId: string;
  reminderAtUtc: string | null;
};

@Injectable()
export class EventsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase,
  ) {}

  async findAll(query: ListEventDto = {}) {
    if (!query.rangeStartUtc && !query.rangeEndUtc) {
      const events = await this.db
        .select()
        .from(eventsTable)
        .orderBy(asc(eventsTable.startUtc));
      return events.map((event) => this.toSingleOccurenceEvent(event));
    }

    if (!query.rangeStartUtc || !query.rangeEndUtc) {
      throw new Error(
        'Both rangeStartUtc and rangeEndUtc must be provided together',
      );
    }

    this.validateDateRange(query.rangeStartUtc, query.rangeEndUtc);

    const events = await this.getEventsForRange(
      query.rangeStartUtc,
      query.rangeEndUtc,
    );
    return events.flatMap((event) =>
      this.generateOccurrences(
        event,
        query.rangeStartUtc as string,
        query.rangeEndUtc as string,
      ),
    );
  }

  async findOne(id: string) {
    const [event] = await this.db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.id, id))
      .limit(1);
    if (!event) {
      throw new Error(`Event with id ${id} not found`);
    }
    return event;
  }

  async create(createEventDto: CreateEventDto) {
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

    await this.ensureNoOverlap(candidate);

    const [created] = await this.db
      .insert(eventsTable)
      .values({
        title: candidate.title,
        startUtc: new Date(candidate.startUtc),
        endUtc: new Date(candidate.endUtc),
        timeZone: candidate.timeZone,
        eventType: candidate.eventType,
        repeatWeekly: candidate.repeatWeekly ?? false,
        repeatUntilUtc: candidate.repeatUntilUtc
          ? new Date(candidate.repeatUntilUtc)
          : null,
        reminderEnabled: candidate.reminderEnabled ?? false,
      })
      .returning();
    return created;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const current = await this.findOne(id);
    const candidate = this.normalizeCandidate({
      id,
      title: updateEventDto.title ?? current.title,
      startUtc: updateEventDto.startUtc ?? current.startUtc.toISOString(),
      endUtc: updateEventDto.endUtc ?? current.endUtc.toISOString(),
      timeZone: updateEventDto.timeZone ?? current.timeZone,
      eventType: updateEventDto.eventType ?? current.eventType,
      repeatWeekly: updateEventDto.repeatWeekly ?? current.repeatWeekly,
      repeatUntilUtc:
        updateEventDto.repeatUntilUtc ??
        current.repeatUntilUtc?.toISOString() ??
        null,
      reminderEnabled:
        updateEventDto.reminderEnabled ?? current.reminderEnabled,
    });
    await this.ensureNoOverlap(candidate);

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
      .where(eq(eventsTable.id, id))
      .returning();
    return updated;
  }

  async remove(id: string): Promise<{ message: string; success: boolean }> {
    await this.findOne(id);
    await this.db.delete(eventsTable).where(eq(eventsTable.id, id));
    return { message: `Event with id ${id} has been deleted`, success: true };
  }

  private normalizeCandidate(candidate: MutableEventShape) {
    const normalized: MutableEventShape = {
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

  private validateDateRange(start: Date | string, end: Date | string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      throw new Error('Invalid date format');
    }
    if (endDate <= startDate) {
      throw new Error('endUtc must be after startUtc');
    }
  }

  private validateRepeatRule(event: MutableEventShape) {
    if (!event.repeatWeekly) {
      return;
    }
    if (!event.repeatUntilUtc) {
      throw new Error(
        'repeatUntilUtc must be provided when repeatWeekly is true',
      );
    }
    if (
      new Date(event.repeatUntilUtc).getTime() <=
      new Date(event.startUtc).getTime()
    ) {
      throw new Error('repeatUntilUtc must be after startUtc');
    }
  }

  private async ensureNoOverlap(
    candidate: MutableEventShape,
    excludeId?: string,
  ) {
    const comparisonBounds = this.getComparisonBounds(candidate);
    const events = await this.getEventsForRange(
      comparisonBounds.startUtc,
      comparisonBounds.endUtc,
      excludeId,
    );

    const conflict = this.findConflict(candidate, events);
    if (!conflict) {
      return;
    }

    const suggestion = this.findSuggestion(candidate, events);
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

  // private async getEventsForRange(
  //   rangeStartUtc: string,
  //   rangeEndUtc: string,
  //   excludeId?: string,
  // ) {
  //   const rangeStart = new Date(rangeStartUtc);
  //   const rangeEnd = new Date(rangeEndUtc);

  //   const predicates = [
  //     or(
  //       and(
  //         eq(eventsTable.repeatWeekly, false),
  //         lte(eventsTable.startUtc, rangeEnd),
  //         gte(eventsTable.endUtc, rangeStart),
  //       ),
  //       and(
  //         eq(eventsTable.repeatWeekly, true),
  //         lte(eventsTable.startUtc, rangeEnd),
  //         gte(eventsTable.endUtc, rangeStart),
  //       ),
  //     ),
  //   ];
  //   if (excludeId) {
  //     predicates.push(ne(eventsTable.id, excludeId));
  //   }
  //   return this.db
  //     .select()
  //     .from(eventsTable)
  //     .where(and(...predicates))
  //     .orderBy(asc(eventsTable.startUtc));
  // }

  private async getEventsForRange(
    rangeStartUtc: string,
    rangeEndUtc: string,
    excludeId?: string,
  ) {
    const rangeStart = new Date(rangeStartUtc);
    const rangeEnd = new Date(rangeEndUtc);

    const overlapCondition = or(
      and(
        eq(eventsTable.repeatWeekly, false),
        lte(eventsTable.startUtc, rangeEnd),
        gte(eventsTable.endUtc, rangeStart),
      ),
      and(
        eq(eventsTable.repeatWeekly, true),
        lte(eventsTable.startUtc, rangeEnd),
        gte(eventsTable.endUtc, rangeStart),
      ),
    );

    return this.db
      .select()
      .from(eventsTable)
      .where(
        and(
          overlapCondition,
          excludeId ? ne(eventsTable.id, excludeId) : undefined,
        ),
      )
      .orderBy(asc(eventsTable.startUtc));
  }

  private findConflict(
    candidate: MutableEventShape,
    events: EventRecord[],
  ): EventOccurrence | null {
    const comparisonBounds = this.getComparisonBounds(candidate, events);
    const candidateOccurences = this.generateOccurrencesFromShape(
      candidate,
      comparisonBounds.startUtc,
      comparisonBounds.endUtc,
    );

    for (const event of events) {
      const existingOccurences = this.generateOccurrences(
        event,
        comparisonBounds.startUtc,
        comparisonBounds.endUtc,
      );
      for (const candidateOccurence of candidateOccurences) {
        for (const existingOccurence of existingOccurences) {
          if (this.occurenceOverlap(candidateOccurence, existingOccurence)) {
            return existingOccurence;
          }
        }
      }
    }
    return null;
  }

  private findSuggestion(candidate: MutableEventShape, events: EventRecord[]) {
    const originalStart = DateTime.fromISO(candidate.startUtc, {
      zone: 'utc',
    });
    const originalEnd = DateTime.fromISO(candidate.endUtc, { zone: 'utc' });
    const dureationMinutes = Math.round(
      originalEnd.diff(originalStart, 'minutes').minutes,
    );

    let shiftedStart = originalStart;
    let shiftedEnd = originalEnd;
    let shiftedRepeatUntil = candidate.repeatUntilUtc
      ? DateTime.fromISO(candidate.repeatUntilUtc, { zone: 'utc' })
      : null;
    for (let attempt = 0; attempt < 64; attempt += 1) {
      const shiftedCandidate = this.normalizeCandidate({
        ...candidate,
        startUtc: shiftedStart.toISO() as string,
        endUtc: shiftedEnd.toISO() as string,
        repeatUntilUtc: shiftedRepeatUntil ? shiftedRepeatUntil.toISO() : null,
      });
      const conflict = this.findConflict(shiftedCandidate, events);

      if (!conflict) {
        return {
          startUtc: shiftedCandidate.startUtc,
          endUtc: shiftedCandidate.endUtc,
        };
      }

      const conflictEnd = DateTime.fromISO(conflict.endUtc, {
        zone: 'utc',
      });
      const minutesToMove = Math.max(
        30,
        Math.ceil(
          (conflictEnd.diff(shiftedStart, 'minutes').minutes / 30) * 30,
        ),
      );
      shiftedStart = shiftedStart.plus({ minutes: minutesToMove });
      shiftedEnd = shiftedStart.plus({ minutes: dureationMinutes });
      shiftedRepeatUntil = shiftedRepeatUntil
        ? shiftedRepeatUntil.plus({ minutes: minutesToMove })
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
      ...events.map((e) => e.startUtc.getTime()),
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

  // private getSeriesEnd(event: MutableEventShape) {
  //   return DateTime.fromISO(event.repeatUntilUtc ?? event.endUtc, {
  //     zone: 'utc',
  //   });
  // }

  private getSeriesEnd(event: MutableEventShape) {
    if (!event.repeatWeekly || !event.repeatUntilUtc) {
      return DateTime.fromISO(event.endUtc, { zone: 'utc' });
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
    const rangeStart = DateTime.fromISO(rangeStartUtc, { zone: 'utc' });
    const rangeEnd = DateTime.fromISO(rangeEndUtc, { zone: 'utc' });
    const eventStart = DateTime.fromISO(event.startUtc, {
      zone: 'utc',
    });
    const eventEnd = DateTime.fromISO(event.endUtc, {
      zone: 'utc',
    });
    const duration = eventEnd.diff(eventStart);

    if (!event.repeatWeekly) {
      if (eventStart < rangeEnd || eventEnd > rangeStart) {
        return [this.createOccurrence(event, eventStart, eventEnd)];
      }
      return [];
    }

    // const seriesEnd = DateTime.fromISO(event.repeatUntilUtc ?? event.endUtc, {
    //   zone: 'utc',
    // });
    const seriesEndUtc = this.getSeriesEnd(event);
    const eventStartLocal = eventStart.setZone(event.timeZone, {
      keepLocalTime: true,
    });
    // const rangeStartLocal = rangeStart
    //   .minus(duration)
    //   .setZone(event.timeZone, { keepLocalTime: true });
    const rangeStartLocal = rangeStart.setZone(event.timeZone);

    let occurrencesStartLocal = eventStartLocal;
    if (rangeStartLocal > eventStartLocal) {
      const weeksToSkip = Math.max(
        0,
        Math.floor(rangeStartLocal.diff(eventStartLocal, 'weeks').weeks),
      );
      occurrencesStartLocal = occurrencesStartLocal.plus({
        weeks: weeksToSkip,
      });
      while (occurrencesStartLocal.plus(duration) <= rangeStart) {
        occurrencesStartLocal = occurrencesStartLocal.plus({ weeks: 1 });
      }
    }
    const occurrences: EventOccurrence[] = [];
    // while (
    //   occurrencesStartLocal.toUTC() <= seriesEnd &&
    //   occurrencesStartLocal.toUTC() < rangeEnd
    // ) {
    while (occurrencesStartLocal.toUTC() <= seriesEndUtc) {
      const occurrenceStartUtc = occurrencesStartLocal.toUTC();
      const occurrenceEndUtc = occurrencesStartLocal.plus(duration);
      if (occurrenceStartUtc >= rangeEnd) {
        break;
      }

      if (occurrenceStartUtc < rangeEnd && occurrenceEndUtc > rangeStart) {
        occurrences.push(
          this.createOccurrence(event, occurrenceStartUtc, occurrenceEndUtc),
        );
      }
      occurrencesStartLocal = occurrencesStartLocal.plus({ weeks: 1 });
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
      occurenceId: `${event.id}_${occurrenceStartUtc.toISO()}`,
      baseEventId: event.id,
      reminderAtUtc,
    };
  }

  private toSingleOccurenceEvent(event: EventRecord): EventOccurrence {
    return this.createOccurrence(
      this.mapRecordToShape(event),
      DateTime.fromJSDate(event.startUtc, { zone: 'utc' }),
      DateTime.fromJSDate(event.endUtc, { zone: 'utc' }),
    );
  }

  private mapRecordToShape(record: EventRecord): MutableEventShape {
    return {
      id: record.id,
      title: record.title,
      startUtc: record.startUtc.toISOString(),
      endUtc: record.endUtc.toISOString(),
      timeZone: record.timeZone,
      eventType: record.eventType,
      repeatWeekly: record.repeatWeekly,
      repeatUntilUtc: record.repeatUntilUtc
        ? record.repeatUntilUtc.toISOString()
        : null,
      reminderEnabled: record.reminderEnabled,
    };
  }

  private occurenceOverlap(a: EventOccurrence, b: EventOccurrence) {
    return (
      new Date(a.startUtc).getTime() < new Date(b.endUtc).getTime() &&
      new Date(a.endUtc).getTime() > new Date(b.startUtc).getTime()
    );
  }
}
