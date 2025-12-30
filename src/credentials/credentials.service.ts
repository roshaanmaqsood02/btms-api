import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { Credentials } from './entities/credentials.entity';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credentials)
    private readonly credentialRepository: Repository<Credentials>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createCredential(
    userId: number,
    data: {
      credentialType: string;
      officialEmail?: string;
      username?: string;
      password?: string;
      accountUrl?: string;
      description?: string;
      expiryDate?: Date;
    },
  ): Promise<Credentials> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if official email already exists for this type
    if (data.officialEmail) {
      const existingEmail = await this.credentialRepository.findOne({
        where: {
          userId,
          credentialType: data.credentialType,
          officialEmail: data.officialEmail,
        },
      });

      if (existingEmail) {
        throw new ConflictException(
          'Official email already exists for this credential type',
        );
      }
    }

    // Encrypt password if provided
    let encryptedPassword: string | undefined;
    if (data.password) {
      encryptedPassword = await this.encryptPassword(data.password);
    }

    const credential = this.credentialRepository.create({
      ...data,
      password: encryptedPassword,
      userId,
      user,
      isActive: true,
    });

    return await this.credentialRepository.save(credential);
  }

  async getCredentialById(id: number): Promise<Credentials> {
    const credential = await this.credentialRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    return this.sanitizeCredential(credential);
  }

  async getUserCredentials(userId: number): Promise<Credentials[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const credentials = await this.credentialRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return credentials.map((cred) => this.sanitizeCredential(cred));
  }

  async getCredentialsByType(
    userId: number,
    credentialType: string,
  ): Promise<Credentials[]> {
    const credentials = await this.credentialRepository.find({
      where: {
        userId,
        credentialType,
      },
    });

    return credentials.map((cred) => this.sanitizeCredential(cred));
  }

  async updateCredential(
    id: number,
    updateData: Partial<Credentials>,
  ): Promise<Credentials> {
    const credential = await this.getCredentialById(id);

    // Handle password update separately
    if (updateData.password) {
      updateData.password = await this.encryptPassword(updateData.password);
    }

    Object.assign(credential, updateData);
    const updatedCredential = await this.credentialRepository.save(credential);
    return this.sanitizeCredential(updatedCredential);
  }

  async updatePassword(id: number, newPassword: string): Promise<Credentials> {
    const credential = await this.getCredentialById(id);

    credential.password = await this.encryptPassword(newPassword);

    const updatedCredential = await this.credentialRepository.save(credential);
    return this.sanitizeCredential(updatedCredential);
  }

  async getCredentialPassword(
    id: number,
    masterPassword: string,
  ): Promise<string> {
    const credential = await this.credentialRepository.findOne({
      where: { id },
    });

    if (!credential || !credential.password) {
      throw new NotFoundException('Credential or password not found');
    }

    // In a real application, you would verify master password here
    // For now, we'll just return the decrypted password
    return this.decryptPassword(credential.password);
  }

  async getExpiringCredentials(days: number = 7): Promise<Credentials[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const credentials = await this.credentialRepository
      .createQueryBuilder('credential')
      .leftJoinAndSelect('credential.user', 'user')
      .where('credential.expiryDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('credential.isActive = :isActive', { isActive: true })
      .getMany();

    return credentials.map((cred) => this.sanitizeCredential(cred));
  }

  async deactivateCredential(id: number): Promise<Credentials> {
    const credential = await this.getCredentialById(id);
    credential.isActive = false;

    const updatedCredential = await this.credentialRepository.save(credential);
    return this.sanitizeCredential(updatedCredential);
  }

  async deleteCredential(id: number): Promise<void> {
    const credential = await this.getCredentialById(id);
    await this.credentialRepository.remove(credential);
  }

  private async encryptPassword(password: string): Promise<string> {
    // In a real application, use proper encryption with a key management system
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  private decryptPassword(encryptedPassword: string): string {
    // In a real application, implement proper decryption
    // This is a simplified version - use proper encryption in production
    return encryptedPassword; // Replace with actual decryption logic
  }

  private sanitizeCredential(credential: Credentials): Credentials {
    const { password, ...rest } = credential;
    return rest as Credentials;
  }
}
