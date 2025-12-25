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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { DeleteUserDto, LoginDto, UpdateUserDto } from 'src/users/dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { profilePicMulterConfig } from 'src/common/multer.config';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                REGISTER                                    */
  /* -------------------------------------------------------------------------- */
  // @Post('register')
  // @UsePipes(new ValidationPipe({ whitelist: true }))
  // async register(@Body() registerDto: RegisterDto) {
  //   return this.authService.register(registerDto);
  // }

  /* -------------------------------------------------------------------------- */
  /*                                  LOGIN                                     */
  /* -------------------------------------------------------------------------- */
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 LOGOUT                                     */
  /* -------------------------------------------------------------------------- */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  /* -------------------------------------------------------------------------- */
  /*                                GET PROFILE                                 */
  /* -------------------------------------------------------------------------- */
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  /* -------------------------------------------------------------------------- */
  /*                            UPDATE PROFILE                                  */
  /* -------------------------------------------------------------------------- */
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateProfile(req.user.id, updateUserDto);
  }

  /* -------------------------------------------------------------------------- */
  /*                       UPDATE PROFILE PICTURE                               */
  /* -------------------------------------------------------------------------- */
  @UseGuards(AuthGuard('jwt'))
  @Put('profile/picture')
  @UseInterceptors(FileInterceptor('profilePic', profilePicMulterConfig))
  async updateProfilePicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() body?: any, // Accept any body to check for userId
  ) {
    if (!file) {
      throw new BadRequestException('Profile picture is required');
    }

    const currentUser = req.user;
    let targetUserId = currentUser.id;

    // Check if admin is updating someone else's picture
    if (body && body.userId && body.userId !== currentUser.id) {
      const allowedRoles = ['HRM', 'OPERATION_MANAGER', 'PROJECT_MANAGER'];

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
  @UseGuards(AuthGuard('jwt'))
  @Delete('profile')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async deleteUser(@Request() req, @Body() deleteUserDto: DeleteUserDto) {
    return this.authService.deleteUser(req.user.id, deleteUserDto.password);
  }
}
