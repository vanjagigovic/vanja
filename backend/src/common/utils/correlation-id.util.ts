import { randomUUID } from 'node:crypto';

export function generateCorrelationId(): string {
  return randomUUID();
}

export function isValidCorrelationId(id: string): boolean {
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
