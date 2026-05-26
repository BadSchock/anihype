import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? '',
    });
  }

  async validate(payload: CurrentUserPayload): Promise<CurrentUserPayload> {
    const result = await this.authService.validateJwtPayload(payload);
    if (!result) throw new UnauthorizedException('Token inválido ou usuário removido');
    return result;
  }
}
