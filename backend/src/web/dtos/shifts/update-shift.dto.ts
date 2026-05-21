import { IsUUID, IsDateString, IsString, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShiftStatus } from '../../../domain/entities/shift.entity';

export class UpdateShiftDto {
  @ApiProperty({ description: 'ID de l\'employé réassigné', required: false })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ description: 'Date et heure de début planifiée (ISO string)', required: false })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'Date et heure de fin planifiée (ISO string)', required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'Statut du quart de travail', enum: ShiftStatus, required: false })
  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;

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

  @ApiProperty({ description: 'Durée réglementaire de la pause en minutes', required: false })
  @IsNumber()
  @IsOptional()
  breakDurationMinutes?: number;
}
