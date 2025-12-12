import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    name?: string,
    gender?: string,
    city?: string,
    country?: string,
    phone?: string,
    postalCode?: string,
  ) {
    const user = await this.userService.create(
      email,
      password,
      name,
      gender,
      city,
      country,
      phone,
      postalCode,
    );

    // Generate access token only (no refresh token for now)
    const accessToken = this.generateAccessToken(user);

    // Remove password from response
    const { password: _, ...result } = user;

    return {
      ...result,
      accessToken,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate access token only
    const accessToken = this.generateAccessToken(user);

    // Remove password from response
    const { password: _, ...result } = user;

    return {
      ...result,
      accessToken,
    };
  }

  async logout(userId: number) {
    // For now, just return success message since we don't have refresh tokens
    // In a real implementation, you might want to blacklist the token
    return { message: 'Logged out successfully' };
  }

  async validateToken(payload: any) {
    // Try to find user by UUID first (more secure), then by ID as fallback
    if (payload.uuid) {
      const userByUuid = await this.userService.findByUuid(payload.uuid);
      if (userByUuid) {
        return userByUuid;
      }
    }

    // Fallback to finding by ID (for backward compatibility)
    if (payload.sub) {
      const userById = await this.userService.findById(payload.sub);
      if (userById) {
        return userById;
      }
    }

    // Try email as last resort
    if (payload.email) {
      return this.userService.findOne(payload.email);
    }

    throw new NotFoundException('User not found from token');
  }

  private generateAccessToken(user: any): string {
    const payload = {
      email: user.email,
      sub: user.id,
      uuid: user.uuid,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '1h', // Token expires in 1 hour
    });
  }

  // update the updateProfile method
  async updateProfile(
    userId: number,
    updateData: {
      name?: string;
      gender?: string;
      city?: string;
      country?: string;
      phone?: string;
      postalCode?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    console.log(
      'Update Profile Data received:',
      JSON.stringify(updateData, null, 2),
    );

    // Check if we have any data to update
    const hasData = Object.values(updateData).some(
      (value) => value !== undefined && value !== null && value !== '',
    );

    if (!hasData) {
      return { message: 'No data provided for update' };
    }

    // Prepare profile data (excluding password fields)
    const { currentPassword, newPassword, ...profileData } = updateData;

    // Validate that newPassword and currentPassword are provided together
    if (newPassword && !currentPassword) {
      throw new BadRequestException(
        'Current password is required to change password',
      );
    }

    if (currentPassword && !newPassword) {
      throw new BadRequestException(
        'New password is required when providing current password',
      );
    }

    // If user wants to change password
    if (newPassword && currentPassword) {
      console.log('Password change requested');

      const user = await this.userService.findByIdWithPassword(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user has a password
      if (!user.password) {
        console.error('User password is null/undefined:', user);
        throw new UnauthorizedException('User password not found');
      }

      console.log('Comparing passwords...');
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Validate new password length
      if (newPassword.length < 6) {
        throw new BadRequestException(
          'New password must be at least 6 characters',
        );
      }

      // If password is being changed, we need to create an update object with the hashed password
      const updateObject: any = {};

      // Add profile data to update object
      Object.keys(profileData).forEach((key) => {
        if (profileData[key] !== undefined && profileData[key] !== '') {
          updateObject[key] = profileData[key];
        }
      });

      // Add the new password (it will be hashed in the userService.update method)
      updateObject.password = newPassword;

      // Update user with both profile data and new password
      const updatedUser = await this.userService.update(userId, updateObject);

      return {
        message: 'Password and profile updated successfully',
        user: updatedUser,
      };
    }

    // If only profile updates (no password change)
    if (Object.keys(profileData).length > 0) {
      const updatedUser = await this.userService.update(userId, profileData);
      return {
        message: 'Profile updated successfully',
        user: updatedUser,
      };
    }

    return { message: 'No valid data to update' };
  }

  // update the deleteUser method
  async deleteUser(userId: number, password: string) {
    console.log('Delete User - Verifying password for user ID:', userId);
    console.log('Password provided for delete:', password);

    // Use findByIdWithPassword to ensure we get the password field
    const user = await this.userService.findByIdWithPassword(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Debug: Check what we got from the database
    console.log('User from DB:', {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      passwordFirst10: user.password?.substring(0, 10) + '...',
    });

    // Check if user has a password
    if (!user.password) {
      console.error('User password is undefined or null');
      throw new UnauthorizedException('User password not found in database');
    }

    // Debug before bcrypt compare
    console.log('Before bcrypt.compare');
    console.log(
      '- Provided password:',
      `"${password}"`,
      'length:',
      password.length,
    );
    console.log(
      '- Stored password hash:',
      user.password.substring(0, 20) + '...',
    );

    try {
      // IMPORTANT: The password stored might be hashed differently
      // Let's check if we need to verify the raw password against the hash
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('bcrypt.compare result:', isPasswordValid);

      if (!isPasswordValid) {
        // Try with trimmed password in case there are spaces
        const trimmedPassword = password.trim();
        if (trimmedPassword !== password) {
          console.log('Trying with trimmed password...');
          const isTrimmedValid = await bcrypt.compare(
            trimmedPassword,
            user.password,
          );
          if (!isTrimmedValid) {
            throw new UnauthorizedException('Password is incorrect');
          }
        } else {
          throw new UnauthorizedException('Password is incorrect');
        }
      }

      return this.userService.deleteUser(userId);
    } catch (error) {
      console.error('bcrypt.compare error details:', error);

      // Check if it's a bcrypt error or something else
      if (error.message && error.message.includes('Illegal arguments')) {
        console.error(
          'BCRYPT ERROR: Likely password hash is corrupted or not a valid bcrypt hash',
        );
        console.error('Stored password value:', user.password);

        // For debugging: Try to see what's in the database
        throw new UnauthorizedException(
          'Password verification failed. The stored password might be corrupted.',
        );
      }

      throw error;
    }
  }
}
