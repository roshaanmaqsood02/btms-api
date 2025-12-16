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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import {
  DeleteUserDto,
  LoginDto,
  RegisterDto,
  UpdateUserDto,
} from 'src/users/dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* -------------------------------------------------------------------------- */
  /*                                REGISTER                                      */
  /* -------------------------------------------------------------------------- */
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /* -------------------------------------------------------------------------- */
  /*                                  LOGIN                                      */
  /* -------------------------------------------------------------------------- */
  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 LOGOUT                                      */
  /* -------------------------------------------------------------------------- */
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  /* -------------------------------------------------------------------------- */
  /*                                GET PROFILE                                   */
  /* -------------------------------------------------------------------------- */
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  /* -------------------------------------------------------------------------- */
  /*                            UPDATE PROFILE                                    */
  /* -------------------------------------------------------------------------- */
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateProfile(req.user.id, updateUserDto);
  }

  /* -------------------------------------------------------------------------- */
  /*                       UPDATE PROFILE PICTURE                                 */
  /* -------------------------------------------------------------------------- */
  @UseGuards(AuthGuard('jwt'))
  @Put('profile/picture')
  @UseInterceptors(FileInterceptor('profilePic'))
  async updateProfilePicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { message: 'No file uploaded' };
    }

    // You can store the file path or URL in DB
    const updatedUser = await this.authService.updateProfile(req.user.id, {
      profilePic: file.filename || file.path,
    });

    return {
      message: 'Profile picture updated successfully',
      user: updatedUser,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                            DELETE USER                                       */
  /* -------------------------------------------------------------------------- */
  @UseGuards(AuthGuard('jwt'))
  @Delete('profile')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async deleteUser(@Request() req, @Body() deleteUserDto: DeleteUserDto) {
    return this.authService.deleteUser(req.user.id, deleteUserDto.password);
  }
}
