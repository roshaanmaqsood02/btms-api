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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import {
  DeleteUserDto,
  LoginDto,
  RegisterDto,
  UpdateUserDto,
} from 'src/users/dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
      registerDto.gender,
      registerDto.city,
      registerDto.country,
      registerDto.phone,
      registerDto.postalCode,
    );
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    return this.authService.logout(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateProfile(req.user.id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('profile')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async deleteUser(@Request() req, @Body() deleteUserDto: DeleteUserDto) {
    return this.authService.deleteUser(req.user.id, deleteUserDto.password);
  }
}
