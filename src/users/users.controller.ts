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
import { JwtCookieGuard } from 'src/common/guard/jwt-cookie.guard';
import { RegisterDto } from './dto';

@Controller('users')
@UseGuards(JwtCookieGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /* -------------------------------------------------------------------------- */
  /*                                 Create User                                */
  /* -------------------------------------------------------------------------- */

  @Post()
  async createUser(@Body() dto: RegisterDto, @Request() req) {
    const currentUser = req.user;

    // Only ADMIN and HRM can create users
    if (
      currentUser.systemRole !== 'ADMIN' &&
      currentUser.systemRole !== 'HRM'
    ) {
      throw new ForbiddenException('Only ADMIN or HRM can create users');
    }

    // HRM restrictions
    if (currentUser.systemRole === 'HRM') {
      const hrAllowedRoles = [
        'EMPLOYEE',
        'PROJECT_MANAGER',
        'OPERATION_MANAGER',
      ];
      if (dto.systemRole && !hrAllowedRoles.includes(dto.systemRole)) {
        throw new ForbiddenException(
          'HRM can only create EMPLOYEE, PROJECT_MANAGER, or OPERATION_MANAGER roles',
        );
      }
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

  @Get(':id')
  async getUserById(@Param('id') id: number) {
    const user = await this.usersService.findById(+id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /* -------------------------------------------------------------------------- */
  /*                     Update USER with ADMIN privileges                      */
  /* -------------------------------------------------------------------------- */

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
    const allowedRoles = ['ADMIN', 'OPERATION_MANAGER', 'HRM']; // Add ADMIN
    if (!allowedRoles.includes(currentUser.systemRole)) {
      throw new ForbiddenException(
        'Only ADMIN, Operation Managers or HRM can update user information',
      );
    }

    // 3. Get the target user
    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // 4. Check role-based restrictions (ADMIN has no restrictions)
    if (currentUser.systemRole !== 'ADMIN') {
      switch (currentUser.systemRole) {
        case 'HRM':
          // HRM cannot update other HRM, Operation Managers, or ADMIN
          if (
            targetUser.systemRole === 'ADMIN' ||
            targetUser.systemRole === 'HRM' ||
            targetUser.systemRole === 'OPERATION_MANAGER'
          ) {
            throw new ForbiddenException(
              'HRM cannot update ADMIN, other HRM, or Operation Managers',
            );
          }
          break;

        case 'OPERATION_MANAGER':
          // Operation Manager cannot update ADMIN, HRM or other Operation Managers
          if (
            targetUser.systemRole === 'ADMIN' ||
            targetUser.systemRole === 'HRM' ||
            targetUser.systemRole === 'OPERATION_MANAGER'
          ) {
            throw new ForbiddenException(
              'Operation Managers cannot update ADMIN, HRM, or other Operation Managers',
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
    }

    // 5. Additional validation for non-ADMIN users
    if (currentUser.systemRole !== 'ADMIN' && dto.systemRole) {
      if (
        dto.systemRole === 'ADMIN' ||
        dto.systemRole === 'HRM' ||
        dto.systemRole === 'OPERATION_MANAGER'
      ) {
        // Only ADMIN can assign ADMIN role
        if (dto.systemRole === 'ADMIN') {
          throw new ForbiddenException('Only ADMIN can assign ADMIN role');
        }

        // Only HRM or ADMIN can assign HRM or Operation Manager roles
        if (
          dto.systemRole === 'HRM' ||
          dto.systemRole === 'OPERATION_MANAGER'
        ) {
          if (
            currentUser.systemRole !== 'HRM' &&
            currentUser.systemRole !== 'ADMIN'
          ) {
            throw new ForbiddenException(
              'Only HRM or ADMIN can assign HRM or Operation Manager roles',
            );
          }
        }

        // Even HRM cannot assign these roles to managers
        if (
          targetUser.systemRole === 'ADMIN' ||
          targetUser.systemRole === 'HRM' ||
          targetUser.systemRole === 'OPERATION_MANAGER'
        ) {
          throw new ForbiddenException(
            'Cannot change system role of existing ADMIN, HRM or Operation Managers',
          );
        }
      }
    }

    return this.usersService.update(targetUserId, dto);
  }

  /* -------------------------------------------------------------------------- */
  /*                           Update Profile Picture                           */
  /* -------------------------------------------------------------------------- */

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

    // 2. Check if current user has permission to update others
    const allowedRoles = [
      'ADMIN',
      'HRM',
      'OPERATION_MANAGER',
      'PROJECT_MANAGER',
    ]; // Add ADMIN

    if (!allowedRoles.includes(currentUser.systemRole)) {
      throw new ForbiddenException(
        'You can only update your own profile picture',
      );
    }

    // 3. Get the target user
    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // 4. Check restrictions for non-ADMIN users
    if (currentUser.systemRole !== 'ADMIN') {
      // Check if trying to update ADMIN, HRM or Operation Manager
      if (
        targetUser.systemRole === 'ADMIN' ||
        targetUser.systemRole === 'HRM' ||
        targetUser.systemRole === 'OPERATION_MANAGER'
      ) {
        // HRM cannot update ADMIN, other HRM or Operation Managers' profile pictures
        if (currentUser.systemRole === 'HRM') {
          throw new ForbiddenException(
            'HRM cannot update profile pictures of ADMIN, other HRM, or Operation Managers',
          );
        }

        // Operation Manager cannot update ADMIN, HRM or other Operation Managers
        if (currentUser.systemRole === 'OPERATION_MANAGER') {
          throw new ForbiddenException(
            'Operation Managers cannot update profile pictures of ADMIN, HRM, or other Operation Managers',
          );
        }

        // Project Manager cannot update ADMIN, HRM or Operation Managers
        if (currentUser.systemRole === 'PROJECT_MANAGER') {
          throw new ForbiddenException(
            'Project Managers cannot update profile pictures of ADMIN, HRM, or Operation Managers',
          );
        }
      }
    }

    // 5. For PM - check if target user is in their projects (only if not ADMIN)
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

    // 6. For OM - check if target user is in their operations (only if not ADMIN)
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

    return this.usersService.updateProfilePic(targetUserId, file);
  }

  /* -------------------------------------------------------------------------- */
  /*                           DELETE User                                      */
  /* -------------------------------------------------------------------------- */

  @Delete(':id')
  async deleteUser(@Param('id') id: number, @Request() req) {
    const currentUser = req.user;
    const targetUserId = +id;

    // Only ADMIN and HRM can delete users
    if (
      currentUser.systemRole !== 'ADMIN' &&
      currentUser.systemRole !== 'HRM'
    ) {
      throw new ForbiddenException('Only ADMIN or HRM can delete users');
    }

    // Prevent users from deleting themselves
    if (currentUser.id === targetUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    // Get the target user
    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // HRM restrictions (ADMIN has no restrictions)
    if (currentUser.systemRole === 'HRM') {
      // Prevent HRM from deleting ADMIN, other HRM or Operation Managers
      if (
        targetUser.systemRole === 'ADMIN' ||
        targetUser.systemRole === 'HRM' ||
        targetUser.systemRole === 'OPERATION_MANAGER'
      ) {
        throw new ForbiddenException(
          'HRM cannot delete ADMIN, other HRM, or Operation Managers',
        );
      }
    }

    return this.usersService.deleteUser(targetUserId);
  }
}
