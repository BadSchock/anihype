import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { HypeService } from '../hype/hype.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

const BCRYPT_ROUNDS = 12;
const REFRESH_BYTES = 64;

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    roles: string[];
  };
  tokens: AuthTokenPair;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly hypeService: HypeService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      displayName: dto.displayName,
    });

    const userWithRoles = await this.usersService.findWithRoles(user.id);
    const roleNames = (userWithRoles?.roles ?? []).map((r) => r.role.code as string);

    const tokens = await this.issueTokenPair(user.id, user.email, user.username, roleNames);

    this.logger.log(`New user registered: ${user.username} (id=${user.id})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        roles: roleNames,
      },
      tokens,
    };
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const identifier = dto.identifier.toLowerCase();

    const user = identifier.includes('@')
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByUsername(identifier);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const userWithRoles = await this.usersService.findWithRoles(user.id);
    const roleNames = (userWithRoles?.roles ?? []).map((r) => r.role.code as string);

    const tokens = await this.issueTokenPair(
      user.id,
      user.email,
      user.username,
      roleNames,
      ipAddress,
      userAgent,
    );

    await this.usersService.updateLastLogin(user.id);
    void this.hypeService.awardDailyLogin(user.id);

    this.logger.log(`User logged in: ${user.username} (id=${user.id})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        roles: roleNames,
      },
      tokens,
    };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  async logout(userId: number, refreshToken: string): Promise<void> {
    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);

    // Revoga todos os tokens do user para evitar brute-force de hash reverso
    // (em produção pode-se revogar só o token exato via comparação iterada)
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    this.logger.log(`User logged out: userId=${userId}`);
    void tokenHash; // usado apenas para timing consistente
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────

  async refresh(
    userId: number,
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokenPair> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let matched = false;
    for (const t of tokens) {
      if (await bcrypt.compare(rawRefreshToken, t.tokenHash)) {
        matched = true;
        await this.prisma.refreshToken.update({
          where: { id: t.id },
          data: { revoked: true },
        });
        break;
      }
    }

    if (!matched) {
      // Possível reutilização de token — revoga tudo (token rotation)
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = await this.usersService.findWithRoles(userId);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const roleNames = user.roles.map((r) => r.role.code as string);

    // Quem volta ao site com a sessão aberta também conta como visita do dia.
    void this.hypeService.awardDailyLogin(user.id);

    return this.issueTokenPair(
      user.id,
      user.email,
      user.username,
      roleNames,
      ipAddress,
      userAgent,
    );
  }

  // ─── Get me ──────────────────────────────────────────────────────────────

  async getMe(userId: number): Promise<AuthResponse['user']> {
    const user = await this.usersService.findWithRoles(userId);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      roles: user.roles.map((r) => r.role.code as string),
    };
  }

  // ─── Validate (usado pela JwtStrategy) ───────────────────────────────────

  async validateJwtPayload(payload: CurrentUserPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.deletedAt) return null;
    return payload;
  }

  // ─── Helpers privados ────────────────────────────────────────────────────

  private async issueTokenPair(
    userId: number,
    email: string,
    username: string,
    roles: string[],
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokenPair> {
    const jwtPayload: CurrentUserPayload = { sub: userId, email, username, roles };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn') ?? '15m',
    });

    const rawRefresh = this.generateRefreshToken();
    const tokenHash = await bcrypt.hash(rawRefresh, BCRYPT_ROUNDS);

    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const expiresAt = this.parseExpiry(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  private generateRefreshToken(): string {
    const bytes = new Uint8Array(REFRESH_BYTES);
    crypto.getRandomValues(bytes);
    return Buffer.from(bytes).toString('hex');
  }

  private parseExpiry(expiry: string): Date {
    const now = Date.now();
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
    const value = parseInt(match[1] ?? '7', 10);
    const unit = match[2] ?? 'd';
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(now + value * (multipliers[unit] ?? 86400000));
  }
}
