// src/admin/controllers/audit-log.controller.ts
import { Controller, Get, Param, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuditLogService, AuditLogQuery } from '../services/audit-log.service';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { IsOptional, IsString, IsNumber, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

class AuditLogQueryDto implements AuditLogQuery {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @IsString()
    adminId?: string;

    @IsOptional()
    @IsString()
    entityType?: any;

    @IsOptional()
    @IsString()
    entityId?: string;

    @IsOptional()
    @IsString()
    action?: any;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startDate?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endDate?: Date;
}

@Controller('admin/audit-logs')
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles('admin') // Only admins can view audit logs
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    @Get()
    async findAll(@Query(ValidationPipe) query: AuditLogQueryDto) {
        return this.auditLogService.findAll(query);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.auditLogService.findById(id);
    }

    @Get('entity/:entityType/:entityId')
    async findByEntity(
        @Param('entityType') entityType: any,
        @Param('entityId') entityId: string,
    ) {
        return this.auditLogService.findByEntity(entityType, entityId);
    }
}
