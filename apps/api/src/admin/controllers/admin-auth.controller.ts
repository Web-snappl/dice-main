// src/admin/controllers/admin-auth.controller.ts
import { Controller, Post, Get, Body, Req, UseGuards, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto, AdminRefreshTokenDto } from '../dto/admin-auth.dto';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { CurrentAdmin, AdminUser } from '../decorators/current-admin.decorator';

@Controller('admin/auth')
export class AdminAuthController {
    constructor(private readonly adminAuthService: AdminAuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body(ValidationPipe) loginDto: AdminLoginDto,
        @Req() request: Request,
    ) {
        return this.adminAuthService.login(loginDto.email, loginDto.password, request);
    }

    @Post('logout')
    @UseGuards(JwtAdminGuard)
    @HttpCode(HttpStatus.OK)
    async logout(
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        await this.adminAuthService.logout(admin.userId, admin.email, request);
        return { message: 'Logged out successfully' };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body(ValidationPipe) refreshDto: AdminRefreshTokenDto) {
        return this.adminAuthService.refreshToken(refreshDto.refreshToken);
    }

    @Get('me')
    @UseGuards(JwtAdminGuard)
    async getMe(@CurrentAdmin() admin: AdminUser) {
        return this.adminAuthService.getMe(admin.userId);
    }
}
