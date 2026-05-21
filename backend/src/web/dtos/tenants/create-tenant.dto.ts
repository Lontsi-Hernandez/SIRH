import { IsString, IsEmail, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  // Informations de l'entreprise
  @ApiProperty({ example: 'Nouvelle Entreprise Inc.' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'nouvelle-inc' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Commerce de détail' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 'https://nouvelle-inc.ca' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: 'contact@nouvelle-inc.ca' })
  @IsEmail()
  contactEmail: string;

  @ApiPropertyOptional({ example: 'QC' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxEmployees?: number;

  // Coordonnées du premier Administrateur (SUPER_ADMIN / CEO)
  @ApiProperty({ example: 'Alice' })
  @IsString()
  adminFirstName: string;

  @ApiProperty({ example: 'Gauthier' })
  @IsString()
  adminLastName: string;

  @ApiProperty({ example: 'ceo@nouvelle-inc.ca' })
  @IsEmail()
  adminEmail: string;
}
