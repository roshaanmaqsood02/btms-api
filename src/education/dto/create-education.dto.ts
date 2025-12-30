import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CreateEducationDto {
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear())
  startYear: number;

  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 10)
  endYear: number;

  @IsString()
  degree: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsString()
  institution: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  gradeScale?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
