import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';
import { UserSystemRole } from 'src/utils/enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                CREATE USER                                 */
  /* -------------------------------------------------------------------------- */
  async create(data: {
    email: string;
    password: string;
    name?: string;
    gender?: string;
    dateOfBirth?: Date;
    bloodGroup?: string;
    cnic?: string;
    maritalStatus?: string;
    city?: string;
    country?: string;
    phone?: string;
    postalCode?: string;
    department?: string;
    projects?: string[];
    positions?: string[];
    systemRole?: 'EMPLOYEE' | 'PROJECT_MANAGER' | 'OPERATION_MANAGER' | 'HRM';
    profilePic?: string;
  }): Promise<User> {
    try {
      // Check if user with email exists
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: data.email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('User with this email already exists');
      }

      // Check if user with CNIC exists (if provided)
      if (data.cnic) {
        const existingUserByCnic = await this.userRepository.findOne({
          where: { cnic: data.cnic },
        });

        if (existingUserByCnic) {
          throw new ConflictException('User with this CNIC already exists');
        }
      }

      // Get the next employee ID
      const maxUser = await this.userRepository
        .createQueryBuilder('user')
        .select('MAX(user.id)', 'maxId')
        .getRawOne();

      const nextNumber = maxUser?.maxId ? parseInt(maxUser.maxId) + 1 : 1;
      const employeeId = `EMP${String(nextNumber).padStart(3, '0')}`;

      // Generate attendance ID
      const attendanceId = `${String(nextNumber).padStart(3, '0')}`;

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Validate system role
      const validSystemRoles = [
        'EMPLOYEE',
        'PROJECT_MANAGER',
        'OPERATION_MANAGER',
        'HRM',
      ];
      const systemRole: UserSystemRole = data.systemRole ?? 'EMPLOYEE';

      // Validate date of birth if provided
      if (data.dateOfBirth) {
        const dob = new Date(data.dateOfBirth);
        if (dob > new Date()) {
          throw new BadRequestException(
            'Date of birth cannot be in the future',
          );
        }
        // Optional: Check if user is at least 18 years old
        const age = this.calculateAge(dob);
        if (age < 18) {
          throw new BadRequestException('User must be at least 18 years old');
        }
      }

      // Validate CNIC if provided (assuming Pakistani CNIC format: 12345-1234567-1)
      if (data.cnic) {
        const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
        if (!cnicRegex.test(data.cnic)) {
          throw new BadRequestException(
            'Invalid CNIC format. Expected: XXXXX-XXXXXXX-X',
          );
        }
      }

      // Validate blood group if provided
      if (data.bloodGroup) {
        const validBloodGroups = [
          'A+',
          'A-',
          'B+',
          'B-',
          'AB+',
          'AB-',
          'O+',
          'O-',
        ];
        if (!validBloodGroups.includes(data.bloodGroup.toUpperCase())) {
          throw new BadRequestException('Invalid blood group');
        }
      }

      // Create user
      const user = this.userRepository.create({
        email: data.email,
        password: hashedPassword,
        employeeId,
        attendanceId,
        uuid: uuidv4(),
        name: data.name,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        bloodGroup: data.bloodGroup?.toUpperCase(),
        cnic: data.cnic,
        maritalStatus: data.maritalStatus,
        city: data.city,
        country: data.country,
        phone: data.phone,
        postalCode: data.postalCode,
        department: data.department,
        projects: data.projects || [],
        positions: data.positions || [],
        systemRole: systemRole,
        profilePic: data.profilePic,
      });

      // Save user
      const savedUser = await this.userRepository.save(user);

      // Return sanitized user (without password)
      return this.sanitizeUser(savedUser);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error creating user:', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  // Helper method to calculate age
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  /* -------------------------------------------------------------------------- */
  /*                               FIND OPERATIONS                              */
  /* -------------------------------------------------------------------------- */

  async findAll(params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;

    const where = search
      ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }]
      : undefined;

    const [users, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users.map((u) => this.sanitizeUser(u)),
      total,
      page,
      limit,
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUuid(uuid: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { uuid } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async findByIdWithPassword(id: number): Promise<User | null> {
    try {
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.id = :id', { id })
        .getOne();

      return user;
    } catch (error) {
      console.error('Error finding user with password:', error);
      return null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              AUTH VALIDATION                               */
  /* -------------------------------------------------------------------------- */

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !user.password) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? this.sanitizeUser(user) : null;
  }

  /* -------------------------------------------------------------------------- */
  /*                               UPDATE USER                                  */
  /* -------------------------------------------------------------------------- */

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Password update
    if (dto.currentPassword || dto.newPassword) {
      if (!dto.currentPassword || !dto.newPassword) {
        throw new BadRequestException(
          'Both current and new passwords are required',
        );
      }

      const userWithPassword = await this.findByIdWithPassword(id);
      if (!userWithPassword?.password) {
        throw new BadRequestException('User password not found');
      }

      const isValid = await bcrypt.compare(
        dto.currentPassword,
        userWithPassword.password,
      );
      if (!isValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      user.password = await bcrypt.hash(dto.newPassword, 10);

      delete (dto as any).currentPassword;
      delete (dto as any).newPassword;
    }

    if (dto.dateOfBirth) {
      user.dateOfBirth = new Date(dto.dateOfBirth);
      delete (dto as any).dateOfBirth;
    }

    if (dto.projects && !Array.isArray(dto.projects)) {
      dto.projects = [dto.projects];
    }

    if (dto.positions && !Array.isArray(dto.positions)) {
      dto.positions = [dto.positions];
    }

    // Update remaining fields
    Object.keys(dto).forEach((key) => {
      if (
        dto[key] !== undefined &&
        key !== 'currentPassword' &&
        key !== 'newPassword' &&
        key !== 'password'
      ) {
        user[key] = dto[key];
      }
    });

    const updatedUser = await this.userRepository.save(user);
    return this.sanitizeUser(updatedUser);
  }

  async updatePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const userWithPassword = await this.findByIdWithPassword(id);

    if (!userWithPassword || !userWithPassword.password) {
      throw new BadRequestException('User password not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      currentPassword,
      userWithPassword.password,
    );
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userRepository.update(id, {
      password: hashedPassword,
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                          PROFILE PICTURE UPDATE                            */
  /* -------------------------------------------------------------------------- */

  async updateProfilePic(userId: number, file: Express.Multer.File) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const baseUrl = this.configService.get<string>('BASE_URL');
    if (!baseUrl) {
      throw new Error('BASE_URL is not defined');
    }

    user.profilePic = `${baseUrl}/uploads/profilePic/${file.filename}`;
    await this.userRepository.save(user);

    return this.sanitizeUser(user);
  }

  /* -------------------------------------------------------------------------- */
  /*                          SIMPLIFIED PERMISSION CHECK                       */
  /* -------------------------------------------------------------------------- */

  /**
   * Check if Project Manager can update a user's profile picture
   * Simplified version - allows PM to update any user
   */
  async canPmUpdateUser(targetUserId: number, pmId: number): Promise<boolean> {
    try {
      // Check if the PM exists
      const projectManager = await this.userRepository.findOne({
        where: {
          id: pmId,
          systemRole: 'PROJECT_MANAGER',
        },
      });

      return !!projectManager; // If PM exists, allow update
    } catch (error) {
      console.error('Error checking PM permission:', error);
      return false;
    }
  }

  /**
   * Check if Operation Manager can update a user's profile picture
   * Simplified version - allows OM to update any user
   */
  async canOmUpdateUser(targetUserId: number, omId: number): Promise<boolean> {
    try {
      // Check if the OM exists
      const operationManager = await this.userRepository.findOne({
        where: {
          id: omId,
          systemRole: 'OPERATION_MANAGER',
        },
      });

      return !!operationManager; // If OM exists, allow update
    } catch (error) {
      console.error('Error checking OM permission:', error);
      return false;
    }
  }
  /* -------------------------------------------------------------------------- */
  /*                                DELETE USER                                 */
  /* -------------------------------------------------------------------------- */

  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // You might want to add additional checks here:
    // - Check if user is active
    // - Check if user has dependencies (projects, etc.)

    try {
      await this.userRepository.remove(user);
      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new BadRequestException('Failed to delete user');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              HELPER METHODS                                */
  /* -------------------------------------------------------------------------- */

  private sanitizeUser(user: User): User {
    const { password, ...rest } = user;
    return rest as User;
  }
}
