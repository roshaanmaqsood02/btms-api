import {
  Controller,
  Get,
  Param,
  Query,
  Put,
  Delete,
  Body,
  NotFoundException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtStrategy } from 'src/auth/jwt.strategy';

@Controller('users')
@UseGuards(JwtStrategy) // 🔐 protect all routes
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users?page=1&limit=10&search=
  @Get()
  async getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
    });
  }

  // GET /users/:id
  @Get(':id')
  async getUserById(@Param('id') id: number) {
    const user = await this.usersService.findById(+id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // PUT /users/:id
  @Put(':id')
  async updateUser(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(+id, dto);
  }

  // PUT /users/:id/profile-picture
  @Put(':id/profile-picture')
  @UseInterceptors(FileInterceptor('profilePic'))
  async uploadProfilePicture(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new NotFoundException('Profile picture not provided');
    }

    return this.usersService.updateProfilePic(+id, file);
  }

  // DELETE /users/:id
  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    return this.usersService.deleteUser(+id);
  }
}
