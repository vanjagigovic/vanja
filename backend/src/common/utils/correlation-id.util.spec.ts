import { describe, expect, it } from '@jest/globals';
import {
  generateCorrelationId,
  isValidCorrelationId,
} from './correlation-id.util';

describe('correlation-id.util', () => {
  describe('generateCorrelationId', () => {
    it('generates a valid UUID v4', () => {
      const id = generateCorrelationId();
      expect(isValidCorrelationId(id)).toBe(true);
    });

    it('generates unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isValidCorrelationId', () => {
    it('returns true for a valid UUID v4', () => {
      const validId = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidCorrelationId(validId)).toBe(true);
    });

    it('returns false for an invalid UUID', () => {
      expect(isValidCorrelationId('invalid-uuid')).toBe(false);
      expect(isValidCorrelationId('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidCorrelationId('not-a-uuid-at-all')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidCorrelationId('')).toBe(false);
    });
  });
});
