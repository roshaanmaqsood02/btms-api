import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  /* ----------------------------- Basic Details ----------------------------- */

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

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

  /* ---------------------------- Contact Details ---------------------------- */

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

  /* ------------------------------- System ---------------------------------- */

  @IsOptional()
  @IsString()
  systemRole?:
    | 'EMPLOYEE'
    | 'PROJECT_MANAGER'
    | 'OPERATION_MANAGER'
    | 'HRM'
    | 'ADMIN'
    | 'CEO'
    | 'CTO'
    | 'STAFF'
    | 'INTERNS';

  @IsOptional()
  @IsString()
  profilePic?: string;
}
