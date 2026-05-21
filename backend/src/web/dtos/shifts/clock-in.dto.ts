import { IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClockInDto {
  @ApiProperty({ description: 'ID du quart de travail (Shift) associé' })
  @IsUUID()
  @IsNotEmpty()
  shiftId: string;

  @ApiProperty({ description: 'Latitude courante GPS de l\'employé', required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ description: 'Longitude courante GPS de l\'employé', required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ description: 'Jeton du QR Code dynamique numérisé', required: true })
  @IsString()
  @IsNotEmpty()
  qrCodeToken: string;

  @ApiProperty({ description: 'Informations sur l\'appareil/navigateur', required: false })
  @IsString()
  @IsOptional()
  deviceInfo?: string;
}
