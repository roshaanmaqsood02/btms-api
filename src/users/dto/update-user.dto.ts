import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';

export class UpdateUserDto {
  /* -------------------------- Basic Details -------------------------- */

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  /* -------------------------- Contact Details -------------------------- */

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
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  cnic?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  /* -------------------------- Professional Details -------------------------- */

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
  @MinLength(6)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;

  @IsOptional()
  @IsString()
  profilePic?: string;

  /* ------------------------------- System ---------------------------------- */

  @IsOptional()
  @IsEnum(['EMPLOYEE', 'PROJECT_MANAGER', 'OPERATION_MANAGER', 'HRM'])
  systemRole?: 'EMPLOYEE' | 'PROJECT_MANAGER' | 'OPERATION_MANAGER' | 'HRM';
}
