// src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    email: string,
    password: string,
    name?: string,
    gender?: string,
    city?: string,
    country?: string,
    phone?: string,
    postalCode?: string,
  ): Promise<User> {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      uuid: uuidv4(),
      name,
      gender,
      city,
      country,
      phone,
      postalCode,
    });

    const savedUser = await this.userRepository.save(user);

    // Remove password before returning
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async findOne(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user && user.password) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }

    return user;
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (user && user.password) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }

    return user;
  }

  // New method: find user by ID including password (for auth operations)
  async findByIdWithPassword(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findByUuid(uuid: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { uuid },
    });

    if (user && user.password) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }

    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    console.log(`[DEBUG] validateUser called for email: ${email}`);

    // Get user WITH password for validation
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      console.log(`[DEBUG] User not found for email: ${email}`);
      return null;
    }

    if (!user.password) {
      console.log(
        `[DEBUG] User found but password is null for email: ${email}`,
      );
      return null;
    }

    console.log(`[DEBUG] User found, comparing password...`);
    console.log(
      `[DEBUG] Stored password hash: ${user.password.substring(0, 30)}...`,
    );

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`[DEBUG] Password comparison result: ${isPasswordValid}`);

    if (isPasswordValid) {
      // Remove password before returning
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }

    console.log(`[DEBUG] Password comparison failed for email: ${email}`);
    return null;
  }

  // src/users/users.service.ts
  async update(id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Merge the update data with existing user data
    Object.assign(user, updateData);

    const updatedUser = await this.userRepository.save(user);

    // Always remove password from response
    if (updatedUser.password) {
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword as User;
    }

    return updatedUser;
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {
      await this.userRepository.remove(user);
      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Delete user error:', error);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
