import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/entities/employee.entity';

export const ROLES_KEY = 'roles';

/**
 * Décorateur @Roles(...) — à placer sur les controllers/endpoints
 * Exemple: @Roles(UserRole.ADMIN, UserRole.HR)
 */
export const Roles = (...roles: UserRole[]) => {
  return (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value || target);
    return descriptor || target;
  };
};

/**
 * RolesGuard — Guard RBAC
 * Vérifie que l'utilisateur connecté possède l'un des rôles requis.
 * Hiérarchie: ADMIN > HR > MANAGER > EMPLOYEE
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private readonly roleHierarchy: Record<UserRole, number> = {
    [UserRole.PLATFORM_ADMIN]: 6,
    [UserRole.SUPER_ADMIN]: 5,
    [UserRole.ADMIN]: 4,
    [UserRole.HR]: 3,
    [UserRole.MANAGER]: 2,
    [UserRole.EMPLOYEE]: 1,
  };

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Pas de restriction de rôle → accès libre (après auth)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let user = request.user;

    // Si req.user n'est pas encore peuplé, on extrait et décode le JWT du header Authorization
    if (!user) {
      const authHeader = request.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
            if (payload && payload.role) {
              user = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
                tenantId: payload.tenantId,
              };
              request.user = user; // Cache dans la requête
            }
          }
        } catch (e) {
          // Token corrompu ou mal formé
        }
      }
    }

    if (!user?.role) {
      throw new ForbiddenException('Utilisateur non authentifié ou rôle manquant');
    }

    const userRoleLevel = this.roleHierarchy[user.role as UserRole] ?? 0;

    // L'utilisateur doit avoir un niveau de rôle >= au minimum requis
    const minRequiredLevel = Math.min(
      ...requiredRoles.map((r) => this.roleHierarchy[r] ?? 99),
    );

    if (userRoleLevel < minRequiredLevel) {
      throw new ForbiddenException(
        `Accès refusé. Rôle requis: ${requiredRoles.join(' ou ')}. Votre rôle: ${user.role}`,
      );
    }

    return true;
  }
}
