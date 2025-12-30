import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsDateString } from 'class-validator';
import { CreateContractDto } from './create-contract.dto';

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @IsOptional()
  @IsDateString()
  terminationDate?: Date;

  @IsOptional()
  @IsDateString()
  resignationDate?: Date;
}
