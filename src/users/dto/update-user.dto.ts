import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsArray()
  projects?: string[];

  @IsOptional()
  @IsArray()
  positions?: string[];

  @IsOptional()
  @IsString()
  profilePic?: string;
}
