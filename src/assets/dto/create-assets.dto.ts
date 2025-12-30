import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsMACAddress,
  Matches,
} from 'class-validator';

export class CreateAssetDto {
  @IsString()
  type: string;

  @IsString()
  assetName: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsString()
  @Matches(/^[A-Z0-9\-]+$/, {
    message:
      'Serial number must contain only uppercase letters, numbers, and hyphens',
  })
  serialNumber: string;

  @IsOptional()
  @IsString()
  screenSize?: string;

  @IsOptional()
  @IsString()
  cpu?: string;

  @IsOptional()
  @IsString()
  gpu?: string;

  @IsOptional()
  @IsString()
  ram?: string;

  @IsOptional()
  @IsMACAddress()
  macAddress?: string;

  @IsOptional()
  @IsString()
  storage?: string;

  @IsOptional()
  @IsString()
  assetTag?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  assignedDate?: Date;

  @IsOptional()
  @IsEnum(['ASSIGNED', 'RETURNED', 'UNDER_REPAIR', 'LOST', 'DAMAGED'])
  assetStatus?: 'ASSIGNED' | 'RETURNED' | 'UNDER_REPAIR' | 'LOST' | 'DAMAGED' =
    'ASSIGNED';
}
