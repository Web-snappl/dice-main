// src/admin/controllers/games.controller.ts
import {
    Controller, Get, Post, Patch, Delete, Param, Query, Body,
    UseGuards, Req, ValidationPipe, HttpCode, HttpStatus
} from '@nestjs/common';
import { Request } from 'express';
import { GamesService } from '../services/games.service';
import { CreateGameConfigDto, UpdateGameConfigDto, GamesQueryDto } from '../dto/games.dto';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentAdmin, AdminUser } from '../decorators/current-admin.decorator';

@Controller('admin/games')
@UseGuards(JwtAdminGuard, RolesGuard)
export class GamesController {
    constructor(private readonly gamesService: GamesService) { }

    @Get()
    @Roles('admin', 'moderator')
    async findAll(@Query(ValidationPipe) query: GamesQueryDto) {
        return this.gamesService.findAll(query);
    }

    @Get(':id')
    @Roles('admin', 'moderator')
    async findById(@Param('id') id: string) {
        return this.gamesService.findById(id);
    }

    @Post()
    @Roles('admin')
    async create(
        @Body(ValidationPipe) dto: CreateGameConfigDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.gamesService.create(dto, admin, request);
    }

    @Patch(':id')
    @Roles('admin')
    async update(
        @Param('id') id: string,
        @Body(ValidationPipe) dto: UpdateGameConfigDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.gamesService.update(id, dto, admin, request);
    }

    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Param('id') id: string,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        await this.gamesService.delete(id, admin, request);
    }

    @Post(':id/activate')
    @Roles('admin')
    async activate(
        @Param('id') id: string,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.gamesService.activate(id, admin, request);
    }

    @Post(':id/deactivate')
    @Roles('admin')
    async deactivate(
        @Param('id') id: string,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.gamesService.deactivate(id, admin, request);
    }
}
