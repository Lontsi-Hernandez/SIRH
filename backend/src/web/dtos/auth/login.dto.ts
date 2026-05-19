import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Identifiant unique ou slug de l\'entreprise (tenant)',
    example: 'quebec-inc',
  })
  @IsNotEmpty({ message: 'L\'identifiant de l\'entreprise est requis' })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'Adresse courriel de l\'utilisateur',
    example: 'ceo@quebec-inc.com',
  })
  @IsNotEmpty({ message: 'L\'adresse courriel est requise' })
  @IsEmail({}, { message: 'L\'adresse courriel doit être valide' })
  email: string;

  @ApiProperty({
    description: 'Mot de passe de l\'utilisateur',
    example: 'password',
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @IsString()
  password: string;
}
