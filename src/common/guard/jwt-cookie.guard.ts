import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtCookieGuard extends AuthGuard(['jwt', 'jwt-cookie']) {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if token exists in either cookies or authorization header
    const hasTokenInCookie = request.cookies && request.cookies['access_token'];
    const hasTokenInHeader =
      request.headers.authorization?.startsWith('Bearer ');

    if (!hasTokenInCookie && !hasTokenInHeader) {
      throw new UnauthorizedException('No authentication token found');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
