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
    const currentUser = req.user;
    const targetUserId = +id;

    // 1. Check if user is trying to update themselves
    if (currentUser.id === targetUserId) {
      // Users can update their own info (except system role)
      if (dto.systemRole && dto.systemRole !== currentUser.systemRole) {
        throw new ForbiddenException('You cannot change your own system role');
      }
      return this.usersService.update(targetUserId, dto);
    }

    // 2. Check if user has permission to update others
    const allowedRoles = ['OPERATION_MANAGER', 'HRM'];
    if (!allowedRoles.includes(currentUser.systemRole)) {
      throw new ForbiddenException(
        'Only Operation Managers or HRM can update user information',
      );
    }

    // 3. Get the target user
    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // 4. Check role-based restrictions
    switch (currentUser.systemRole) {
      case 'HRM':
        // HRM cannot update other HRM or Operation Managers
        if (
          targetUser.systemRole === 'HRM' ||
          targetUser.systemRole === 'OPERATION_MANAGER'
        ) {
          throw new ForbiddenException(
            'HRM cannot update other HRM or Operation Managers',
          );
        }
        break;

      case 'OPERATION_MANAGER':
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
        break;
    }

    // 5. Additional validation: Prevent changing to HRM or OPERATION_MANAGER role
    if (dto.systemRole) {
      if (dto.systemRole === 'HRM' || dto.systemRole === 'OPERATION_MANAGER') {
        // Only HRM can assign these roles, but not to themselves or other managers
        if (currentUser.systemRole !== 'HRM') {
          throw new ForbiddenException(
            'Only HRM can assign HRM or Operation Manager roles',
          );
        }
        // Even HRM cannot assign these roles to managers
        if (
          targetUser.systemRole === 'HRM' ||
          targetUser.systemRole === 'OPERATION_MANAGER'
        ) {
          throw new ForbiddenException(
            'Cannot change system role of existing HRM or Operation Managers',
          );
        }
      }
    }

    return this.usersService.update(targetUserId, dto);
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

    // 3. Get the target user
    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // 4. Check if trying to update another HRM or Operation Manager
    if (
      targetUser.systemRole === 'HRM' ||
      targetUser.systemRole === 'OPERATION_MANAGER'
    ) {
      // HRM cannot update other HRM or Operation Managers' profile pictures
      if (currentUser.systemRole === 'HRM') {
        throw new ForbiddenException(
          'HRM cannot update profile pictures of other HRM or Operation Managers',
        );
      }
      // Operation Manager cannot update HRM or other Operation Managers
      if (currentUser.systemRole === 'OPERATION_MANAGER') {
        throw new ForbiddenException(
          'Operation Managers cannot update profile pictures of HRM or other Operation Managers',
        );
      }
    }

    // 5. For PM - check if target user is in their projects
    if (currentUser.systemRole === 'PROJECT_MANAGER') {
      // Project Manager cannot update HRM or Operation Managers
      if (
        targetUser.systemRole === 'HRM' ||
        targetUser.systemRole === 'OPERATION_MANAGER'
      ) {
        throw new ForbiddenException(
          'Project Managers cannot update profile pictures of HRM or Operation Managers',
        );
      }

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

    // 6. For OM - check if target user is in their operations
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

    return this.usersService.updateProfilePic(targetUserId, file);
  }

  /* -------------------------------------------------------------------------- */
  /*                           DELETE User Only HRM                             */
  /* -------------------------------------------------------------------------- */

  // DELETE /users/:id - Only HRM
  @Delete(':id')
  async deleteUser(@Param('id') id: number, @Request() req) {
    const currentUser = req.user;
    const targetUserId = +id;

    // Only HRM can delete users
    if (currentUser.systemRole !== 'HRM') {
      throw new ForbiddenException('Only HRM can delete users');
    }

    // Prevent HRM from deleting themselves
    if (currentUser.id === targetUserId) {
      throw new ForbiddenException('HRM cannot delete their own account');
    }

    // Get the target user
    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Prevent HRM from deleting other HRM or Operation Managers
    if (
      targetUser.systemRole === 'HRM' ||
      targetUser.systemRole === 'OPERATION_MANAGER'
    ) {
      throw new ForbiddenException(
        'HRM cannot delete other HRM or Operation Managers',
      );
    }

    return this.usersService.deleteUser(targetUserId);
  }
}
