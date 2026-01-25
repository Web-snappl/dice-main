// src/admin/dto/reports.dto.ts
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateReportDto {
    @IsEnum(['open', 'in_review', 'resolved'])
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    moderatorNotes?: string;

    @IsString()
    @IsOptional()
    resolution?: string;
}

export class ReportsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @IsEnum(['open', 'in_review', 'resolved'])
    status?: string;

    @IsOptional()
    @IsString()
    reportedUserId?: string;

    @IsOptional()
    @IsString()
    reporterId?: string;
}
