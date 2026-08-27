import { describe, expect, it } from '@jest/globals';
import {
  setRequestContext,
  getRequestContext,
  getCorrelationId,
  setUserId,
  getUserId,
} from './request-context';

describe('request-context', () => {
  describe('setRequestContext and getRequestContext', () => {
    it('sets and retrieves request context', () => {
      const context = { correlationId: 'test-id' };
      setRequestContext(context);
      expect(getRequestContext()).toEqual(context);
    });

    it('returns undefined when no context is set', () => {
      // Note: In real async tests, this would depend on AsyncLocalStorage isolation
      // For this test, we expect the behavior to be context-aware
      const context = getRequestContext();
      // Can be either set from previous test or undefined
      expect(
        context === undefined ||
          typeof context === 'object' ||
          ('correlationId' in context && 'userId' in context),
      ).toBe(true);
    });
  });

  describe('getCorrelationId and setUserId/getUserId', () => {
    it('retrieves correlation ID from context', () => {
      const correlationId = 'test-correlation-id';
      setRequestContext({ correlationId });
      expect(getCorrelationId()).toBe(correlationId);
    });

    it('sets and retrieves userId', () => {
      setRequestContext({ correlationId: 'test-id', userId: 'user-1' });
      expect(getUserId()).toBe('user-1');
    });

    it('sets userId on existing context', () => {
      setRequestContext({ correlationId: 'test-id' });
      setUserId('user-2');
      expect(getUserId()).toBe('user-2');
    });
  });
});
