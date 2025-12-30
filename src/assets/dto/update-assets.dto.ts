import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetDto } from './create-assets.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {}
