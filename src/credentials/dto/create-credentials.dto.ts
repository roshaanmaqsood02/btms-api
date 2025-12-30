import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateCredentialDto {
  @IsString()
  @IsEnum([
    'OFFICIAL_EMAIL',
    'VPN',
    'GITHUB',
    'JIRA',
    'SLACK',
    'ADMIN_PANEL',
    'OTHER',
  ])
  credentialType:
    | 'OFFICIAL_EMAIL'
    | 'VPN'
    | 'GITHUB'
    | 'JIRA'
    | 'SLACK'
    | 'ADMIN_PANEL'
    | 'OTHER';

  @IsOptional()
  @IsEmail()
  officialEmail?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsUrl()
  accountUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: Date;

  @IsOptional()
  @IsString()
  recoveryEmail?: string;

  @IsOptional()
  @IsString()
  securityQuestions?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
