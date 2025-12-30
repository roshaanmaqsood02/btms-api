import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EmployeeContract } from './entities/contract.entity';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(EmployeeContract)
    private readonly contractRepository: Repository<EmployeeContract>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createContract(
    userId: number,
    data: {
      employeeStatus:
        | 'EMPLOYEED'
        | 'TERMINATED'
        | 'RESIGNED'
        | 'ON_LEAVE'
        | 'PROBATION';
      jobType:
        | 'FULL_TIME'
        | 'PART_TIME'
        | 'CONTRACT'
        | 'INTERNSHIP'
        | 'FREELANCE';
      department?: string;
      designation?: string;
      position?: string;
      reportingHr?: string;
      reportingManager?: string;
      reportingTeamLead?: string;
      joiningDate: Date;
      contractStart: Date;
      contractEnd?: Date;
      shift?: 'MORNING' | 'EVENING' | 'NIGHT' | 'ROTATIONAL';
      workLocation: 'ON_SITE' | 'REMOTE' | 'HYBRID';
    },
  ): Promise<EmployeeContract> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate dates
    if (data.contractEnd && data.contractStart > data.contractEnd) {
      throw new BadRequestException(
        'Contract start date cannot be after end date',
      );
    }

    if (data.joiningDate > new Date()) {
      throw new BadRequestException('Joining date cannot be in the future');
    }

    // Check for active contract
    const activeContract = await this.contractRepository.findOne({
      where: {
        userId,
        isActive: true,
      },
    });

    if (activeContract) {
      throw new ConflictException('User already has an active contract');
    }

    const contract = this.contractRepository.create({
      ...data,
      userId,
      user,
    });

    return await this.contractRepository.save(contract);
  }

  async getContractById(id: number): Promise<EmployeeContract> {
    console.log('=== Debug: Fetching contract by ID ===', id);

    // Use findOne instead of QueryBuilder for simpler queries
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async getUserContracts(userId: number): Promise<EmployeeContract[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.contractRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveContract(userId: number): Promise<EmployeeContract | null> {
    return await this.contractRepository.findOne({
      where: {
        userId,
        isActive: true,
      },
      relations: ['user'],
    });
  }

  async updateContract(
    id: number,
    updateData: Partial<EmployeeContract>,
  ): Promise<EmployeeContract> {
    const contract = await this.getContractById(id);

    if (updateData.contractStart && updateData.contractEnd) {
      if (updateData.contractStart > updateData.contractEnd) {
        throw new BadRequestException(
          'Contract start date cannot be after end date',
        );
      }
    }

    Object.assign(contract, updateData);
    return await this.contractRepository.save(contract);
  }

  async terminateContract(
    id: number,
    terminationDate: Date,
  ): Promise<EmployeeContract> {
    const contract = await this.getContractById(id);

    contract.employeeStatus = 'TERMINATED';
    contract.isActive = false;
    contract.contractEnd = terminationDate;

    return await this.contractRepository.save(contract);
  }

  async getContractsExpiringSoon(
    days: number = 30,
  ): Promise<EmployeeContract[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await this.contractRepository.find({
      where: {
        contractEnd: Between(startDate, endDate),
        isActive: true,
      },
      relations: ['user'],
    });
  }

  async deleteContract(id: number): Promise<void> {
    const contract = await this.getContractById(id);
    await this.contractRepository.remove(contract);
  }
}
