import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/auth/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion de l\'utilisateur (SSO Keycloak avec fallback local)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Utilisateur connecté avec succès',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Identifiants ou tenant invalides',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
