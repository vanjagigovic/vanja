import { describe, expect, it } from '@jest/globals';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes a password into a scrypt-prefixed salted value', async () => {
    const hash = await service.hash('CorrectHorseBatteryStaple!');
    const [algorithm, salt, derivedKey] = hash.split(':');

    expect(algorithm).toBe('scrypt');
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(derivedKey).toMatch(/^[0-9a-f]{128}$/);
    expect(hash).not.toContain('CorrectHorseBatteryStaple!');
  });

  it('verifies a password against its generated hash', async () => {
    const hash = await service.hash('CorrectHorseBatteryStaple!');

    await expect(
      service.verify('CorrectHorseBatteryStaple!', hash),
    ).resolves.toBe(true);
  });

  it('rejects a password that does not match the stored hash', async () => {
    const hash = await service.hash('CorrectHorseBatteryStaple!');

    await expect(service.verify('DifferentPassword!', hash)).resolves.toBe(
      false,
    );
  });

  it.each([
    '',
    'plain-text-password',
    'scrypt',
    'scrypt:missing-hash',
    'bcrypt:salt:hash',
  ])('rejects a malformed stored hash: %s', async (storedHash) => {
    await expect(service.verify('password', storedHash)).resolves.toBe(false);
  });

  it('supports hashing and verification of an empty string', async () => {
    const hash = await service.hash('');

    await expect(service.verify('', hash)).resolves.toBe(true);
    await expect(service.verify('not-empty', hash)).resolves.toBe(false);
  });
});
