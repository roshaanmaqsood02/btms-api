import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Asset } from './entities/assets.entity';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async assignAsset(
    userId: number,
    data: {
      type: string;
      assetName: string;
      company?: string;
      model?: string;
      serialNumber: string;
      screenSize?: string;
      cpu?: string;
      gpu?: string;
      ram?: string;
      macAddress?: string;
      storage?: string;
      assetTag?: string;
      notes?: string;
    },
  ): Promise<Asset> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if serial number already exists
    const existingAsset = await this.assetRepository.findOne({
      where: { serialNumber: data.serialNumber },
    });

    if (existingAsset) {
      throw new ConflictException(
        'Asset with this serial number already exists',
      );
    }

    const asset = this.assetRepository.create({
      ...data,
      userId,
      user,
      assignedDate: new Date(),
      assetStatus: 'ASSIGNED',
    });

    return await this.assetRepository.save(asset);
  }

  async getAssetById(id: number): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async getUserAssets(userId: number): Promise<Asset[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.assetRepository.find({
      where: { userId },
      order: { assignedDate: 'DESC' },
    });
  }

  async getActiveAssets(userId: number): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: {
        userId,
        assetStatus: 'ASSIGNED',
      },
    });
  }

  async updateAsset(id: number, updateData: Partial<Asset>): Promise<Asset> {
    const asset = await this.getAssetById(id);

    if (
      updateData.serialNumber &&
      updateData.serialNumber !== asset.serialNumber
    ) {
      const existingAsset = await this.assetRepository.findOne({
        where: { serialNumber: updateData.serialNumber },
      });

      if (existingAsset && existingAsset.id !== id) {
        throw new ConflictException(
          'Asset with this serial number already exists',
        );
      }
    }

    Object.assign(asset, updateData);
    return await this.assetRepository.save(asset);
  }

  async returnAsset(id: number, returnNotes?: string): Promise<Asset> {
    const asset = await this.getAssetById(id);

    asset.assetStatus = 'RETURNED';
    asset.returnDate = new Date();
    if (returnNotes) {
      asset.notes = asset.notes
        ? `${asset.notes}\nReturn: ${returnNotes}`
        : `Return: ${returnNotes}`;
    }

    return await this.assetRepository.save(asset);
  }

  async searchAssets(searchTerm: string): Promise<Asset[]> {
    return await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.user', 'user')
      .where('asset.serialNumber LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('asset.assetTag LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('asset.macAddress LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('asset.assetName LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('user.name LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('user.employeeId LIKE :search', { search: `%${searchTerm}%` })
      .getMany();
  }

  async getAssetsByStatus(status: Asset['assetStatus']): Promise<Asset[]> {
    return await this.assetRepository.find({
      where: { assetStatus: status },
      relations: ['user'],
    });
  }

  async deleteAsset(id: number): Promise<void> {
    const asset = await this.getAssetById(id);
    await this.assetRepository.remove(asset);
  }
}
