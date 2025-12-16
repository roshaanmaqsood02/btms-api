// src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                CREATE USER                                 */
  /* -------------------------------------------------------------------------- */
  async create(data: {
    email: string;
    password: string;
    name?: string;
    gender?: string;
    city?: string;
    country?: string;
    phone?: string;
    postalCode?: string;
    department?: string;
    projects?: string[];
    positions?: string[];
    profilePic?: string;
  }): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.userRepository.create({
      ...data,
      password: hashedPassword,
      uuid: uuidv4(),
    });

    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  /* -------------------------------------------------------------------------- */
  /*                               FIND OPERATIONS                               */
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
        .addSelect('user.password') // Explicitly select password
        .where('user.id = :id', { id })
        .getOne();

      return user;
    } catch (error) {
      console.error('Error finding user with password:', error);
      return null;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              AUTH VALIDATION                                */
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
  /*                               UPDATE USER                                   */
  /* -------------------------------------------------------------------------- */

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Password update logic
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

      // Hash the new password
      user.password = await bcrypt.hash(dto.newPassword, 10);

      // Clean password fields from DTO to prevent any accidental overwrite
      delete (dto as any).currentPassword;
      delete (dto as any).newPassword;
    }

    // Update other fields (skip password, current/newPassword)
    Object.keys(dto).forEach((key) => {
      if (
        dto[key] !== undefined &&
        key !== 'currentPassword' &&
        key !== 'newPassword' &&
        key !== 'password' // Extra safety
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
  /*                          PROFILE PICTURE UPDATE                              */
  /* -------------------------------------------------------------------------- */

  async updateProfilePic(id: number, file: Express.Multer.File): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Example: local storage
    user.profilePic = `/uploads/users/${file.filename}`;

    const updatedUser = await this.userRepository.save(user);
    return this.sanitizeUser(updatedUser);
  }

  /* -------------------------------------------------------------------------- */
  /*                                DELETE USER                                   */
  /* -------------------------------------------------------------------------- */

  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  /* -------------------------------------------------------------------------- */
  /*                              HELPER METHODS                                  */
  /* -------------------------------------------------------------------------- */

  private sanitizeUser(user: User): User {
    const { password, ...rest } = user;
    return rest as User;
  }
}
