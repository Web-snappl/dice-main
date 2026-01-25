// src/admin/decorators/current-admin.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AdminUser {
    userId: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
}

export const CurrentAdmin = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AdminUser => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
