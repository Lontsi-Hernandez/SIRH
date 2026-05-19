import { IsNotEmpty, IsUUID, IsDateString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignHousingDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'ID de l\'employé' })
  @IsNotEmpty({ message: 'L\'ID de l\'employé est requis' })
  @IsUUID('4', { message: 'L\'ID de l\'employé doit être un UUID valide' })
  employeeId: string;

  @ApiProperty({ example: '2026-06-01', description: 'Date de début de l\'hébergement' })
  @IsNotEmpty({ message: 'La date de début est requise' })
  @IsDateString({}, { message: 'La date de début doit être une date valide (YYYY-MM-DD)' })
  startDate: string;

  @ApiProperty({ example: '2026-12-01', description: 'Date de fin de l\'hébergement', required: false })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être une date valide (YYYY-MM-DD)' })
  endDate?: string;

  @ApiProperty({ example: 450.00, description: 'Montant de la déduction sur la paie' })
  @IsNotEmpty({ message: 'Le montant de déduction est requis' })
  @IsNumber({}, { message: 'Le montant doit être un nombre valide' })
  @Min(0, { message: 'Le montant de déduction ne peut pas être négatif' })
  rentDeductionAmount: number;
}
