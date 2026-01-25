// src/admin/controllers/reports.controller.ts
import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from '../services/reports.service';
import { UpdateReportDto, ReportsQueryDto } from '../dto/reports.dto';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentAdmin, AdminUser } from '../decorators/current-admin.decorator';

@Controller('admin/reports')
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles('admin', 'moderator')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get()
    async findAll(@Query(ValidationPipe) query: ReportsQueryDto) {
        return this.reportsService.findAll(query);
    }

    @Get('stats')
    async getStats() {
        return this.reportsService.getStats();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.reportsService.findById(id);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body(ValidationPipe) dto: UpdateReportDto,
        @CurrentAdmin() admin: AdminUser,
        @Req() request: Request,
    ) {
        return this.reportsService.update(id, dto, admin, request);
    }
}
