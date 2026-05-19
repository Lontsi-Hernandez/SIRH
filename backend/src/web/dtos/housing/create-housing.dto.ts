import { IsNotEmpty, IsString, IsInt, Min, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHousingDto {
  @ApiProperty({ example: 'Résidence Sainte-Foy A' })
  @IsNotEmpty({ message: 'Le nom de la résidence est requis' })
  @IsString()
  name: string;

  @ApiProperty({ example: '1234 Rue de l\'Université' })
  @IsNotEmpty({ message: 'L\'adresse est requise' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Québec' })
  @IsNotEmpty({ message: 'La ville est requise' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'G1V 0A6' })
  @IsNotEmpty({ message: 'Le code postal est requis' })
  @IsString()
  postalCode: string;

  @ApiProperty({ example: 4, description: 'Capacité totale en lits' })
  @IsNotEmpty({ message: 'La capacité est requise' })
  @IsInt({ message: 'La capacité doit être un nombre entier' })
  @Min(1, { message: 'La capacité doit être d\'au moins 1 personne' })
  capacity: number;

  @ApiProperty({ example: 450.00, description: 'Loyer mensuel par personne' })
  @IsNotEmpty({ message: 'Le loyer mensuel est requis' })
  @IsNumber({}, { message: 'Le loyer doit être un nombre valide' })
  @Min(0, { message: 'Le loyer ne peut pas être négatif' })
  monthlyRent: number;

  @ApiProperty({ example: 'Proche du campus, 4 chambres individuelles', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
