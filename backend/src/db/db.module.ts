import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => {
        const pool = new Pool({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          connectionString: env.DATABASE_URL,
        });
        return drizzle(pool);
      },
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class DbModule {}
