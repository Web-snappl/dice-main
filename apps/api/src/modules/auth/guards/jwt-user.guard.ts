// src/modules/auth/guards/jwt-user.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface UserTokenPayload {
    sub: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}

@Injectable()
export class JwtUserGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization header');
        }

        const token = authHeader.substring(7);

        try {
            const secret = this.configService.get<string>('JWT_SECRET') || 'jwt_secret_change_in_production';
            const payload = jwt.verify(token, secret) as UserTokenPayload;

            // Attach user info to request
            request.user = {
                userId: payload.sub,
                email: payload.email,
                role: payload.role,
                firstName: payload.firstName,
                lastName: payload.lastName,
                phoneNumber: payload.phoneNumber,
            };

            return true;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException('Token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedException('Invalid token');
            }
            throw new UnauthorizedException('Authentication failed');
        }
    }
}
