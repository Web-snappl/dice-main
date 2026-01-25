// src/admin/controllers/users.controller.ts
import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query,
    UseGuards, Req, ValidationPipe, HttpCode, HttpStatus
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto, SuspendUserDto, BanUserDto, UsersQueryDto } from '../dto/users.dto';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentAdmin, AdminUser } from '../decorators/current-admin.decorator';

@Controller('admin/users')
@UseGuards(JwtAdminGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles('admin', 'moderator')
    async findAll(@Query(ValidationPipe) query: UsersQueryDto) {
        return this.usersService.findAll(query);
    }

    @Get(':id')
    @Roles('admin', 'moderator')
    async findById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Get(':id/history')
    @Roles('admin', 'moderator')
    async findByIdWithHistory(@Param('id') id: string) {
        return this.usersService.findByIdWithHistory(id);
    }

    @Post()
    @Roles('admin')
    async create(
        @Body(ValidationPipe) dto: CreateUserDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.usersService.create(dto, admin, request);
    }

    @Patch(':id')
    @Roles('admin')
    async update(
        @Param('id') id: string,
        @Body(ValidationPipe) dto: UpdateUserDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.usersService.update(id, dto, admin, request);
    }

    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Param('id') id: string,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        await this.usersService.delete(id, admin, request);
    }

    @Post(':id/suspend')
    @Roles('admin', 'moderator')
    async suspend(
        @Param('id') id: string,
        @Body(ValidationPipe) dto: SuspendUserDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.usersService.suspend(id, dto.reason, admin, request);
    }

    @Post(':id/ban')
    @Roles('admin')
    async ban(
        @Param('id') id: string,
        @Body(ValidationPipe) dto: BanUserDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.usersService.ban(id, dto.reason, admin, request);
    }

    @Post(':id/restore')
    @Roles('admin')
    async restore(
        @Param('id') id: string,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.usersService.restore(id, admin, request);
    }
}
