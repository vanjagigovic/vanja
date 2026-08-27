/* eslint-disable prettier/prettier */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';

function readProjectFile(relativePath: string) {
  return readFileSync(join(__dirname, relativePath), 'utf8');
}

describe('database indexes', () => {
  it('retains the event index that matches user-scoped chronological access', () => {
    const schemaText = readProjectFile('schema.ts');

    expect(schemaText).toContain(
      "userStartUtcIndex: index('events_user_id_start_utc_idx').on(",
    );
    expect(schemaText).toContain('table.userId');
    expect(schemaText).toContain('table.startUtc');
    expect(schemaText).not.toContain(
      "startUtcIndex: index('events_start_utc_idx').on(table.startUtc)",
    );
    expect(schemaText).not.toContain(
      "activeRangeIndex: index('events_active_range_idx').on(",
    );
  });

  it('retains the session expiry cleanup index and drops the speculative user index', () => {
    const schemaText = readProjectFile('schema.ts');
    const migrationText = readProjectFile('../../drizzle/0006_bored_ogun.sql');

    expect(schemaText).toContain(
      "expiresAtIndex: index('sessions_expires_at_idx').on(table.expiresAt)",
    );
    expect(schemaText).not.toContain(
      "userIdIndex: index('sessions_user_id_idx').on(table.userId)",
    );

    expect(migrationText).toContain('DROP INDEX "sessions_user_id_idx";');
    expect(migrationText).toContain('DROP INDEX "events_start_utc_idx";');
    expect(migrationText).toContain('DROP INDEX "events_repeat_until_utc_idx";');
    expect(migrationText).toContain('DROP INDEX "events_active_range_idx";');
  });
});
