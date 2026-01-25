// src/admin/controllers/rewards.controller.ts
import {
    Controller, Get, Post, Patch, Param, Query, Body,
    UseGuards, Req, ValidationPipe
} from '@nestjs/common';
import { Request } from 'express';
import { RewardsService } from '../services/rewards.service';
import { CreateRewardDto, UpdateRewardDto, RewardsQueryDto } from '../dto/rewards.dto';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentAdmin, AdminUser } from '../decorators/current-admin.decorator';

@Controller('admin/rewards')
@UseGuards(JwtAdminGuard, RolesGuard)
export class RewardsController {
    constructor(private readonly rewardsService: RewardsService) { }

    @Get()
    @Roles('admin', 'moderator')
    async findAll(@Query(ValidationPipe) query: RewardsQueryDto) {
        return this.rewardsService.findAll(query);
    }

    @Get('stats')
    @Roles('admin', 'moderator')
    async getStats() {
        return this.rewardsService.getStats();
    }

    @Get(':id')
    @Roles('admin', 'moderator')
    async findById(@Param('id') id: string) {
        return this.rewardsService.findById(id);
    }

    @Post()
    @Roles('admin')
    async create(
        @Body(ValidationPipe) dto: CreateRewardDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.rewardsService.create(dto, admin, request);
    }

    @Patch(':id')
    @Roles('admin')
    async update(
        @Param('id') id: string,
        @Body(ValidationPipe) dto: UpdateRewardDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.rewardsService.update(id, dto, admin, request);
    }
}
