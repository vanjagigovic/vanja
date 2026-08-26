import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('hex');
    const derivedKey = (await scryptAsync(
      password,
      salt,
      KEY_LENGTH,
    )) as Buffer;

    return `scrypt:${salt}:${derivedKey.toString('hex')}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, salt, hash] = storedHash.split(':');

    if (algorithm !== 'scrypt' || !salt || !hash) {
      return false;
    }

    const expectedKey = Buffer.from(hash, 'hex');
    const actualKey = (await scryptAsync(
      password,
      salt,
      expectedKey.length,
    )) as Buffer;

    return (
      expectedKey.length === actualKey.length &&
      timingSafeEqual(expectedKey, actualKey)
    );
  }
}
