import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ReturnAssetDto {
  @IsDateString()
  returnDate: Date;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  returnNotes?: string;

  @IsOptional()
  @IsString()
  returnedTo?: string;
}
