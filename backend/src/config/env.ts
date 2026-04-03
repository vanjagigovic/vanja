/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL!,
  PORT: process.env.PORT,
});
