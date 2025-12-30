import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Education } from './entities/education.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EducationService {
  constructor(
    @InjectRepository(Education)
    private readonly educationRepository: Repository<Education>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createEducation(
    userId: number,
    data: {
      startYear: number;
      endYear: number;
      degree: string;
      fieldOfStudy?: string;
      institution: string;
      grade?: string;
      gradeScale?: string;
      description?: string;
    },
  ): Promise<Education> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate years
    if (data.startYear > data.endYear) {
      throw new BadRequestException('Start year cannot be after end year');
    }

    const currentYear = new Date().getFullYear();
    if (data.startYear > currentYear) {
      throw new BadRequestException('Start year cannot be in the future');
    }

    const isCurrent = data.endYear >= currentYear;

    const education = this.educationRepository.create({
      ...data,
      userId,
      user,
      isCurrent,
    });

    return await this.educationRepository.save(education);
  }

  async getEducationById(id: number): Promise<Education> {
    const education = await this.educationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!education) {
      throw new NotFoundException('Education record not found');
    }

    return education;
  }

  async getUserEducations(userId: number): Promise<Education[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.educationRepository.find({
      where: { userId },
      order: { endYear: 'DESC', startYear: 'DESC' },
    });
  }

  async updateEducation(
    id: number,
    updateData: Partial<Education>,
  ): Promise<Education> {
    const education = await this.getEducationById(id);

    if (updateData.startYear && updateData.endYear) {
      if (updateData.startYear > updateData.endYear) {
        throw new BadRequestException('Start year cannot be after end year');
      }

      const currentYear = new Date().getFullYear();
      updateData.isCurrent = updateData.endYear >= currentYear;
    }

    Object.assign(education, updateData);
    return await this.educationRepository.save(education);
  }

  async deleteEducation(id: number): Promise<void> {
    const education = await this.getEducationById(id);
    await this.educationRepository.remove(education);
  }

  async getLatestEducation(userId: number): Promise<Education | null> {
    return await this.educationRepository.findOne({
      where: { userId },
      order: { endYear: 'DESC' },
    });
  }

  async getEducationByDegree(
    userId: number,
    degree: string,
  ): Promise<Education[]> {
    return await this.educationRepository.find({
      where: {
        userId,
        degree,
      },
    });
  }
}
