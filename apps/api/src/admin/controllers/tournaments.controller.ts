// src/admin/controllers/tournaments.controller.ts
import {
    Controller, Get, Post, Patch, Delete, Param, Query, Body,
    UseGuards, Req, ValidationPipe, HttpCode, HttpStatus
} from '@nestjs/common';
import { Request } from 'express';
import { TournamentsService } from '../services/tournaments.service';
import { CreateTournamentDto, UpdateTournamentDto, TournamentsQueryDto } from '../dto/tournaments.dto';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentAdmin, AdminUser } from '../decorators/current-admin.decorator';

@Controller('admin/tournaments')
@UseGuards(JwtAdminGuard, RolesGuard)
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) { }

    @Get()
    @Roles('admin', 'moderator')
    async findAll(@Query(ValidationPipe) query: TournamentsQueryDto) {
        return this.tournamentsService.findAll(query);
    }

    @Get('upcoming')
    @Roles('admin', 'moderator')
    async getUpcoming() {
        return this.tournamentsService.getUpcoming();
    }

    @Get(':id')
    @Roles('admin', 'moderator')
    async findById(@Param('id') id: string) {
        return this.tournamentsService.findById(id);
    }

    @Post()
    @Roles('admin')
    async create(
        @Body(ValidationPipe) dto: CreateTournamentDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.tournamentsService.create(dto, admin, request);
    }

    @Patch(':id')
    @Roles('admin')
    async update(
        @Param('id') id: string,
        @Body(ValidationPipe) dto: UpdateTournamentDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.tournamentsService.update(id, dto, admin, request);
    }

    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(
        @Param('id') id: string,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        await this.tournamentsService.delete(id, admin, request);
    }
}
