import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { User } from '../../domain/entities/user.entity';
import { Tenant } from '../../domain/entities/tenant.entity';
import { LoginDto } from '../dtos/auth/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    try {
      const { email, password, tenantId } = dto;

      // 1. Résolution du tenant (par ID ou par son Slug/code entreprise)
      // On vérifie si tenantId est un UUID valide pour éviter une erreur de syntaxe PostgreSQL
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId);

      const tenant = await this.tenantRepository.findOne({
        where: isUuid
          ? { id: tenantId, isActive: true }
          : { slug: tenantId, isActive: true },
      });

      if (!tenant) {
        this.logger.warn(`Tentative de connexion pour un tenant inexistant ou inactif : ${tenantId}`);
        throw new UnauthorizedException('Identifiants d\'entreprise invalides');
      }

      // 2. Recherche de l'utilisateur dans PostgreSQL
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase().trim(), tenantId: tenant.id },
        relations: ['employee'],
      });

      if (!user || !user.isActive) {
        this.logger.warn(`Tentative de connexion échouée pour : ${email} sur le tenant : ${tenant.name}`);
        throw new UnauthorizedException('Identifiants invalides ou compte inactif');
      }

      // 3. Authentification Keycloak (Solution propre de production)
      let keycloakToken: string | null = null;
      const isProduction = this.configService.get('NODE_ENV') === 'production';

      try {
        const keycloakUrl = this.configService.get('KEYCLOAK_URL');
        const realm = this.configService.get('KEYCLOAK_REALM', 'hrms');
        const clientId = this.configService.get('KEYCLOAK_CLIENT_ID', 'hrms-backend');
        const clientSecret = this.configService.get('KEYCLOAK_CLIENT_SECRET');

        const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;

        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', clientId);
        if (clientSecret) {
          params.append('client_secret', clientSecret);
        }
        params.append('username', email);
        params.append('password', password);

        this.logger.log(`Tentative d'authentification Keycloak SSO sur : ${tokenUrl}`);
        const keycloakResponse = await axios.post(tokenUrl, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 5000,
        });

        keycloakToken = keycloakResponse.data.access_token;
        this.logger.log(`✅ Authentification SSO Keycloak réussie pour l'utilisateur : ${email}`);
      } catch (err: any) {
        this.logger.warn(
          `⚠️ Authentification Keycloak non configurée ou indisponible (${err.message}).`,
        );

        // En production, si Keycloak échoue, on bloque la connexion pour des raisons de sécurité
        if (isProduction) {
          throw new UnauthorizedException('Serveur d\'authentification SSO indisponible.');
        }
      }

      // 4. Fallback développement local : Si Keycloak est hors-ligne/non configuré, on génère un JWT local
      // Cela permet aux seeds et utilisateurs de développement d'accéder au dashboard immédiatement
      const token = keycloakToken || this.generateLocalToken(user, tenant.id);

      return {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.employee?.firstName || '',
          lastName: user.employee?.lastName || '',
          role: user.employee?.role || 'EMPLOYEE',
          tenantId: tenant.id, // Requis au format UUID par le middleware TenantMiddleware
        },
      };
    } catch (error: any) {
      this.logger.error(`❌ Erreur fatale lors de la connexion : ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateLocalToken(user: User, tenantId: string): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.employee?.role || 'EMPLOYEE',
      tenantId: tenantId,
    };
    return this.jwtService.sign(payload);
  }
}
