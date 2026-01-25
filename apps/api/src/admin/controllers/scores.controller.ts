// src/admin/controllers/scores.controller.ts
import { Controller, Get, Post, Param, Query, Body, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { Request } from 'express';
import { ScoresService } from '../services/scores.service';
import { ScoresQueryDto, RankingsQueryDto, ResetScoreDto } from '../dto/scores.dto';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentAdmin, AdminUser } from '../decorators/current-admin.decorator';

@Controller('admin/scores')
@UseGuards(JwtAdminGuard, RolesGuard)
export class ScoresController {
    constructor(private readonly scoresService: ScoresService) { }

    @Get()
    @Roles('admin', 'moderator')
    async findAll(@Query(ValidationPipe) query: ScoresQueryDto) {
        return this.scoresService.findAll(query);
    }

    @Get('rankings')
    @Roles('admin', 'moderator')
    async getRankings(@Query(ValidationPipe) query: RankingsQueryDto) {
        return this.scoresService.getRankings(query);
    }

    @Get('suspicious')
    @Roles('admin', 'moderator')
    async getSuspiciousScores() {
        return this.scoresService.getSuspiciousScores();
    }

    @Post(':userId/reset')
    @Roles('admin')
    async resetScores(
        @Param('userId') userId: string,
        @Body(ValidationPipe) dto: ResetScoreDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.scoresService.resetScores(userId, dto.reason, admin, request);
    }
}
