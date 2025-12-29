// Update at the top of auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express'; // Use import type
import { AuthService } from './auth.service';
import { DeleteUserDto, LoginDto, UpdateUserDto } from 'src/users/dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { profilePicMulterConfig } from 'src/common/multer.config';
import { UsersService } from 'src/users/users.service';
import { JwtCookieGuard } from '../common/guard/jwt-cookie.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                  LOGIN                                     */
  /* -------------------------------------------------------------------------- */
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    console.log(
      'Login successful, setting cookie with token:',
      result.accessToken?.substring(0, 20) + '...',
    );

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/',
      domain: 'localhost', // Add this for localhost
    });

    const { accessToken, ...userWithoutToken } = result;

    return {
      message: 'Login successful',
      user: userWithoutToken,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                 LOGOUT                                     */
  /* -------------------------------------------------------------------------- */
  @UseGuards(JwtCookieGuard) // Use the new guard
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    // Clear the cookie
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return this.authService.logout(req.user.id);
  }

  /* -------------------------------------------------------------------------- */
  /*                                GET PROFILE                                 */
  /* -------------------------------------------------------------------------- */
  @UseGuards(JwtCookieGuard) // Use the new guard
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  /* -------------------------------------------------------------------------- */
  /*                            UPDATE PROFILE                                  */
  /* -------------------------------------------------------------------------- */
  @UseGuards(JwtCookieGuard) // Use the new guard
  @Put('profile')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateProfile(req.user.id, updateUserDto);
  }

  /* -------------------------------------------------------------------------- */
  /*                       UPDATE PROFILE PICTURE                               */
  /* -------------------------------------------------------------------------- */
  @UseGuards(JwtCookieGuard)
  @Put('profile/picture')
  @UseInterceptors(FileInterceptor('profilePic', profilePicMulterConfig))
  async updateProfilePicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() body?: any,
  ) {
    if (!file) {
      throw new BadRequestException('Profile picture is required');
    }

    const currentUser = req.user;
    let targetUserId = currentUser.id;

    if (body && body.userId && body.userId !== currentUser.id) {
      const allowedRoles = [
        'ADMIN',
        'HRM',
        'OPERATION_MANAGER',
        'PROJECT_MANAGER',
      ];

      if (!allowedRoles.includes(currentUser.systemRole)) {
        throw new ForbiddenException(
          'You can only update your own profile picture',
        );
      }

      targetUserId = body.userId;
    }

    return {
      message: 'Profile picture updated successfully',
      user: await this.usersService.updateProfilePic(targetUserId, file),
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                            DELETE USER                                     */
  /* -------------------------------------------------------------------------- */
  @UseGuards(JwtCookieGuard) // Use the new guard
  @Delete('profile')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async deleteUser(@Request() req, @Body() deleteUserDto: DeleteUserDto) {
    return this.authService.deleteUser(req.user.id, deleteUserDto.password);
  }

  /* -------------------------------------------------------------------------- */
  /*                            REFRESH TOKEN                                   */
  /* -------------------------------------------------------------------------- */
  @UseGuards(JwtCookieGuard)
  @Post('refresh')
  async refreshToken(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = this.authService.generateAccessToken(req.user);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/',
    });

    return { message: 'Token refreshed successfully' };
  }
}
