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
  ForbiddenException,
  Request,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { profilePicMulterConfig } from 'src/common/multer.config';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto';

/* -------------------------------------------------------------------------- */
/*                                Create User Only HRM                        */
/* -------------------------------------------------------------------------- */

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createUser(@Body() dto: RegisterDto, @Request() req) {
    if (req.user.systemRole !== 'HRM') {
      throw new ForbiddenException('Only HRM can create users');
    }

    return this.usersService.create({
      ...dto,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      systemRole: dto.systemRole ?? 'EMPLOYEE',
    });
  }

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

  /* -------------------------------------------------------------------------- */
  /*                                Get User By ID                              */
  /* -------------------------------------------------------------------------- */

  // GET /users/:id
  @Get(':id')
  async getUserById(@Param('id') id: number) {
    const user = await this.usersService.findById(+id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /* -------------------------------------------------------------------------- */
  /*                     Update USER By OPERATION_MANAGER or HRM                */
  /* -------------------------------------------------------------------------- */

  // PUT /users/:id - Only allowed for OPERATION_MANAGER or HRM
  @Put(':id')
  async updateUser(
    @Param('id') id: number,
    @Body() dto: UpdateUserDto,
    @Request() req,
  ) {
    // Check if user has permission
    const allowedRoles = ['OPERATION_MANAGER', 'HRM'];
    if (!allowedRoles.includes(req.user.systemRole)) {
      throw new ForbiddenException(
        'Only Operation Managers or HRM can update user information',
      );
    }

    // Prevent self-promotion/demotion if not HRM
    if (dto.systemRole && req.user.systemRole !== 'HRM') {
      throw new ForbiddenException('Only HRM can change user roles');
    }

    // Get the target user
    const targetUser = await this.usersService.findById(+id);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // HRM-specific validations
    if (req.user.systemRole === 'HRM') {
      // HRM can update anyone
      return this.usersService.update(+id, dto);
    }

    // OPERATION_MANAGER specific restrictions
    if (req.user.systemRole === 'OPERATION_MANAGER') {
      // Operation Manager cannot update HRM or other Operation Managers
      if (
        targetUser.systemRole === 'HRM' ||
        targetUser.systemRole === 'OPERATION_MANAGER'
      ) {
        throw new ForbiddenException(
          'Operation Managers cannot update HRM or other Operation Managers',
        );
      }

      // Operation Manager cannot change roles
      if (dto.systemRole && dto.systemRole !== targetUser.systemRole) {
        throw new ForbiddenException(
          'Operation Managers cannot change user roles',
        );
      }
    }

    return this.usersService.update(+id, dto);
  }

  /* -------------------------------------------------------------------------- */
  /*                           Update Profile Picture                           */
  /* -------------------------------------------------------------------------- */

  // Profile picture update
  @Put(':id/profile-picture')
  @UseInterceptors(FileInterceptor('profilePic', profilePicMulterConfig))
  async updateUserProfilePic(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const currentUser = req.user;
    const targetUserId = +id;

    // 1. Everyone can update their OWN profile picture
    if (currentUser.id === targetUserId) {
      return this.usersService.updateProfilePic(targetUserId, file);
    }

    // 2. Check if current user is HRM/OM/PM to update others
    const managerRoles = ['HRM', 'OPERATION_MANAGER', 'PROJECT_MANAGER'];

    if (!managerRoles.includes(currentUser.systemRole)) {
      throw new ForbiddenException(
        'You can only update your own profile picture',
      );
    }

    // 3. For PM - check if target user is in their projects
    if (currentUser.systemRole === 'PROJECT_MANAGER') {
      const canUpdate = await this.usersService.canPmUpdateUser(
        targetUserId,
        currentUser.id,
      );

      if (!canUpdate) {
        throw new ForbiddenException(
          'You can only update profile pictures for users in your projects',
        );
      }
    }

    // 4. For OM - check if target user is in their operations
    if (currentUser.systemRole === 'OPERATION_MANAGER') {
      const canUpdate = await this.usersService.canOmUpdateUser(
        targetUserId,
        currentUser.id,
      );

      if (!canUpdate) {
        throw new ForbiddenException(
          'You can only update profile pictures for users in your operations',
        );
      }
    }

    console.log('Profile picture update called for user:', id);
    console.log('File received:', file?.filename);
    console.log('Current user:', req.user.id);

    // 5. HRM can update anyone (no additional checks needed)
    return this.usersService.updateProfilePic(targetUserId, file);
  }

  /* -------------------------------------------------------------------------- */
  /*                           DELETE User Only HRM                             */
  /* -------------------------------------------------------------------------- */

  // DELETE /users/:id - Only HRM
  @Delete(':id')
  async deleteUser(@Param('id') id: number, @Request() req) {
    // Only HRM can delete users
    if (req.user.systemRole !== 'HRM') {
      throw new ForbiddenException('Only HRM can delete users');
    }

    return this.usersService.deleteUser(+id);
  }
}
