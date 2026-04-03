/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => {
        const pool = new Pool({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          connectionString: env.DATABASE_URL!,
        });
        return drizzle(pool);
      },
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class DbModule {}
