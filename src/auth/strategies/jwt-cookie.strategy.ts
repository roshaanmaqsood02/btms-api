// src/auth/strategies/jwt-cookie.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';

// Simplified approach using ExtractJwt's built-in methods
@Injectable()
export class JwtCookieStrategy extends PassportStrategy(
  Strategy,
  'jwt-cookie',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'btms-secret-123',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findByUuid(payload.uuid);

    if (!user) {
      throw new UnauthorizedException('User not found or token is invalid');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
