import { describe, expect, it } from '@jest/globals';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('uses the JWT subject as the authenticated user id', () => {
    const strategy = new JwtStrategy();

    expect(strategy.validate({ sub: 'user-a' })).toEqual({ id: 'user-a' });
  });
});
