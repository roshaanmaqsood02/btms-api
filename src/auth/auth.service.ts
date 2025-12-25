import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { RegisterDto } from 'src/users/dto';
import { UserSystemRole } from 'src/utils/enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                REGISTER                                    */
  /* -------------------------------------------------------------------------- */
  async register(data: RegisterDto, requester: { systemRole: UserSystemRole }) {
    // Allow HRM and ADMIN to create users
    if (requester.systemRole !== 'HRM' && requester.systemRole !== 'ADMIN') {
      throw new ForbiddenException('Only HRM or ADMIN can create users');
    }

    // ADMIN can create any role, HRM can only create EMPLOYEE, PROJECT_MANAGER, OPERATION_MANAGER
    if (requester.systemRole === 'HRM') {
      const hrAllowedRoles = [
        'EMPLOYEE',
        'PROJECT_MANAGER',
        'OPERATION_MANAGER',
      ];
      if (data.systemRole && !hrAllowedRoles.includes(data.systemRole)) {
        throw new ForbiddenException(
          'HRM can only create EMPLOYEE, PROJECT_MANAGER, or OPERATION_MANAGER roles',
        );
      }
    }

    const user = await this.userService.create({
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      systemRole: data.systemRole ?? 'EMPLOYEE',
    });

    return user;
  }

  /* -------------------------------------------------------------------------- */
  /*                                 LOGIN                                      */
  /* -------------------------------------------------------------------------- */
  async login(email: string, password: string) {
    const user = await this.userService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);

    return {
      ...user,
      accessToken, // Still return token for clients that want it in response body
    };
  }

  // Add a method to generate token response
  generateTokenResponse(user: any) {
    const accessToken = this.generateAccessToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        uuid: user.uuid,
        systemRole: user.systemRole,
        firstName: user.firstName,
        lastName: user.lastName,
        // Add other user fields you want to expose
      },
      accessToken, // For clients that want to handle tokens manually
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                                LOGOUT                                      */
  /* -------------------------------------------------------------------------- */
  async logout(userId: number) {
    return { message: 'Logged out successfully' };
  }

  /* -------------------------------------------------------------------------- */
  /*                              VALIDATE TOKEN                                */
  /* -------------------------------------------------------------------------- */
  async validateToken(payload: any) {
    if (payload.uuid) {
      const userByUuid = await this.userService.findByUuid(payload.uuid);
      if (userByUuid) return userByUuid;
    }

    if (payload.sub) {
      const userById = await this.userService.findById(payload.sub);
      if (userById) return userById;
    }

    if (payload.email) {
      const userByEmail = await this.userService.findByEmail(payload.email);
      if (userByEmail) return userByEmail;
    }

    throw new NotFoundException('User not found from token');
  }

  /* -------------------------------------------------------------------------- */
  /*                           UPDATE PROFILE / PASSWORD                        */
  /* -------------------------------------------------------------------------- */
  async updateProfile(userId: number, updateData: UpdateUserDto) {
    // FIXED: Do NOT manipulate the DTO or add plain password
    // Just pass the full updateData (including current/newPassword if present)
    // UsersService will handle validation + hashing correctly

    const updatedUser = await this.userService.update(userId, updateData);

    const hasPasswordChange =
      updateData.currentPassword && updateData.newPassword;

    return {
      message: hasPasswordChange
        ? 'Password and profile updated successfully'
        : 'Profile updated successfully',
      user: updatedUser,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                            DELETE USER WITH PASSWORD                       */
  /* -------------------------------------------------------------------------- */
  async deleteUser(userId: number, password: string) {
    console.log(`Attempting to delete user ${userId}`);

    const user = await this.userService.findByIdWithPassword(userId);

    if (!user) {
      console.log('User not found');
      throw new NotFoundException('User not found');
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
    });

    if (!user.password) {
      console.log('User has no password (e.g., social login)');
      throw new UnauthorizedException('Password not set');
    }

    console.log('Comparing passwords...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);

    if (!isValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    await this.userService.deleteUser(userId);

    return {
      message: 'User deleted successfully',
      userId: user.id,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                              HELPER METHODS                                */
  /* -------------------------------------------------------------------------- */

  /* -------------------------------------------------------------------------- */
  /*                              HELPER METHODS                                */
  /* -------------------------------------------------------------------------- */
  // Change from private to public
  public generateAccessToken(user: any): string {
    const payload = {
      email: user.email,
      sub: user.id,
      uuid: user.uuid,
      systemRole: user.systemRole,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h',
    });
  }

  // OR Option 2: Create a public wrapper method
  public createAccessToken(user: any): string {
    return this.generateAccessToken(user);
  }
}
