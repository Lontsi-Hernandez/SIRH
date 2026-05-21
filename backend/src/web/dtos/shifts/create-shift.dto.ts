import { IsUUID, IsNotEmpty, IsDateString, IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftDto {
  @ApiProperty({ description: 'ID de l\'employé' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'Date et heure de début planifiée (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'Date et heure de fin planifiée (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ description: 'Adresse ou nom du lieu de travail', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Latitude du lieu de travail', required: false })
  @IsNumber()
  @IsOptional()
  locationLat?: number;

  @ApiProperty({ description: 'Longitude du lieu de travail', required: false })
  @IsNumber()
  @IsOptional()
  locationLng?: number;

  @ApiProperty({ description: 'Notes explicatives', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Indique s\'il s\'agit d\'heures supplémentaires planifiées', required: false })
  @IsBoolean()
  @IsOptional()
  isOvertime?: boolean;

  @ApiProperty({ description: 'Durée réglementaire de la pause en minutes', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  breakDurationMinutes?: number;
}
