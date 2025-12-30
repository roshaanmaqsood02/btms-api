import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateCredentialPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;

  @IsOptional()
  @IsString()
  masterPassword?: string; // For verification
}
