import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DbModule } from '../db/db.module';
import { env } from '../config/env';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordService } from './password.service';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    DbModule,
    PassportModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1_000 }]),
    JwtModule.register({
      secret: env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
