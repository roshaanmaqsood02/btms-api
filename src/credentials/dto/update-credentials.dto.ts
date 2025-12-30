import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateCredentialDto } from './create-credentials.dto';

export class UpdateCredentialDto extends PartialType(CreateCredentialDto) {
  @IsOptional()
  @IsString()
  masterPassword?: string; // For password verification
}
