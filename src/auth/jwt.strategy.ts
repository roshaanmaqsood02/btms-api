import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'btms-secret-123',
    });
  }

  async validate(payload: any) {
    // Use UsersService directly to find the user by UUID
    const user = await this.usersService.findByUuid(payload.uuid);

    if (!user) {
      throw new UnauthorizedException('User not found or token is invalid');
    }

    // Always strip the password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
