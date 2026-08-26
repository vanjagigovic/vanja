import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq, isNull, lte } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from '../db/db.module';
import { sessionsTable, usersTable } from '../db/schema';
import { env } from '../config/env';
import { LoginAuthDto } from './dto/login-auth-dto';
import { RegisterAuthDto } from './dto/register-auth-dto';
import { AuthSession, AuthUser } from './auth.types';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(dto: RegisterAuthDto): Promise<AuthSession> {
    const email = this.normalizeEmail(dto.email);
    const [existingUser] = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const [user] = await this.db
      .insert(usersTable)
      .values({ email, passwordHash })
      .returning({ id: usersTable.id, email: usersTable.email });

    return this.createAuthSession(user);
  }

  async login(dto: LoginAuthDto): Promise<AuthSession> {
    const email = this.normalizeEmail(dto.email);
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.email, email)))
      .limit(1);

    if (
      !user ||
      !(await this.passwordService.verify(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthSession({ id: user.id, email: user.email });
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokenHash = this.hashRefreshToken(refreshToken);
    const [session] = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.tokenHash, tokenHash))
      .limit(1);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [user] = await this.db
      .select({ id: usersTable.id, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [revokedSession] = await this.db
      .update(sessionsTable)
      .set({ revokedAt: new Date(), lastUsedAt: new Date() })
      .where(
        and(eq(sessionsTable.id, session.id), isNull(sessionsTable.revokedAt)),
      )
      .returning({ id: sessionsTable.id });

    if (!revokedSession) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.createAuthSession(user);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.db
      .update(sessionsTable)
      .set({ revokedAt: new Date(), lastUsedAt: new Date() })
      .where(
        and(
          eq(sessionsTable.tokenHash, this.hashRefreshToken(refreshToken)),
          isNull(sessionsTable.revokedAt),
        ),
      );
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.db
      .delete(sessionsTable)
      .where(lte(sessionsTable.expiresAt, new Date()));
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async createAuthSession(user: AuthUser): Promise<AuthSession> {
    const accessToken = await this.jwtService.signAsync({ sub: user.id });
    const refreshToken = randomBytes(32).toString('base64url');
    const now = new Date();

    await this.db.insert(sessionsTable).values({
      userId: user.id,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: new Date(
        now.getTime() + env.JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS * 1000,
      ),
    });

    return { user, accessToken, refreshToken };
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
