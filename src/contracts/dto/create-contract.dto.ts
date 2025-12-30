import {
  IsString,
  IsEnum,
  IsDate,
  IsOptional,
  IsDateString,
  ValidateIf,
  IsBoolean,
} from 'class-validator';

export class CreateContractDto {
  @IsEnum(['EMPLOYEED', 'TERMINATED', 'RESIGNED', 'ON_LEAVE', 'PROBATION'])
  employeeStatus:
    | 'EMPLOYEED'
    | 'TERMINATED'
    | 'RESIGNED'
    | 'ON_LEAVE'
    | 'PROBATION';

  @IsEnum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'])
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  reportingHr?: string;

  @IsOptional()
  @IsString()
  reportingManager?: string;

  @IsOptional()
  @IsString()
  reportingTeamLead?: string;

  @IsDateString()
  joiningDate: Date;

  @IsDateString()
  contractStart: Date;

  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => o.contractEnd !== null && o.contractEnd !== undefined)
  contractEnd?: Date;

  @IsOptional()
  @IsEnum(['MORNING', 'EVENING', 'NIGHT', 'ROTATIONAL'])
  shift?: 'MORNING' | 'EVENING' | 'NIGHT' | 'ROTATIONAL';

  @IsEnum(['ON_SITE', 'REMOTE', 'HYBRID'])
  workLocation: 'ON_SITE' | 'REMOTE' | 'HYBRID';

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
