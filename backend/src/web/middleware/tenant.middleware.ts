import { Injectable, NestMiddleware, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../domain/entities/tenant.entity';

/**
 * TenantMiddleware — Middleware multi-tenant
 *
 * Extrait le tenant_id depuis :
 * 1. Header X-Tenant-ID (API clients)
 * 2. Sous-domaine (ex: acme.hrms.com → tenant = "acme")
 * 3. JWT claim "tenant_id"
 *
 * Injecte le tenant résolu dans req['tenant']
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Routes publiques qui n'ont pas besoin d'un tenant
    const publicRoutes = ['/api/v1/health', '/api/docs', '/api/v1/auth/login'];
    if (publicRoutes.some((route) => req.path.startsWith(route))) {
      return next();
    }

    let tenantId: string | undefined;

    // 1. Header X-Tenant-ID
    if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'] as string;
    }

    // 2. Sous-domaine
    else if (req.hostname && req.hostname.includes('.')) {
      const subdomain = req.hostname.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        const tenant = await this.tenantRepository.findOne({
          where: { slug: subdomain, isActive: true },
        });
        if (tenant) {
          req['tenant'] = tenant;
          return next();
        }
      }
    }

    // 3. JWT claim (extrait par Passport avant ce middleware)
    else if ((req['user'] as any)?.tenantId) {
      tenantId = (req['user'] as any).tenantId;
    }

    // Fallback développement
    else if (process.env.NODE_ENV === 'development') {
      tenantId = process.env.DEFAULT_TENANT_ID || 'quebec-inc';
    }

    if (!tenantId) {
      throw new BadRequestException('X-Tenant-ID header is required');
    }

    // Résolution du tenant (par ID ou par son Slug/code entreprise)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId);
    let tenant = await this.tenantRepository.findOne({
      where: isUuid
        ? { id: tenantId, isActive: true }
        : { slug: tenantId, isActive: true },
    });

    // Fallback résilient en développement : récupérer le tout premier tenant si aucun n'est trouvé
    if (!tenant && process.env.NODE_ENV === 'development') {
      tenant = await this.tenantRepository.findOne({ where: { isActive: true } });
      if (tenant) {
        this.logger.warn(`Tenant "${tenantId}" non trouvé. Fallback sur le premier tenant actif : "${tenant.name}"`);
      }
    }

    if (!tenant) {
      throw new BadRequestException(`Tenant "${tenantId}" not found or inactive`);
    }

    req['tenant'] = tenant;
    req['tenantId'] = tenant.id;

    this.logger.debug(`Tenant resolved: ${tenant.name} (${tenant.id})`);
    next();
  }
}
