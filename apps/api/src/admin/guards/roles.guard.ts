// src/admin/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/auth/auth.mongoSchema';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.role) {
            throw new ForbiddenException('Access denied: No role assigned');
        }

        // Normalize roles for comparison (handle case variations)
        const normalizedUserRole = user.role.toLowerCase();
        const normalizedRequiredRoles = requiredRoles.map(r => r.toLowerCase());

        const hasRole = normalizedRequiredRoles.includes(normalizedUserRole);

        if (!hasRole) {
            throw new ForbiddenException(`Access denied: Requires one of roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
