// src/admin/dto/tournaments.dto.ts
import { IsString, IsOptional, IsDate, IsEnum, IsObject, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTournamentDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @Type(() => Date)
    @IsDate()
    startDate: Date;

    @Type(() => Date)
    @IsDate()
    endDate: Date;

    @IsObject()
    @IsOptional()
    rules?: Record<string, any>;

    @IsObject()
    @IsOptional()
    rewardConfig?: {
        topN?: number;
        rewards?: { position: number; description: string; value?: number }[];
    };

    @IsString()
    @IsOptional()
    gameConfigId?: string;

    @IsNumber()
    @IsOptional()
    maxParticipants?: number;
}

export class UpdateTournamentDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    startDate?: Date;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    endDate?: Date;

    @IsEnum(['draft', 'scheduled', 'active', 'completed', 'cancelled'])
    @IsOptional()
    status?: string;

    @IsObject()
    @IsOptional()
    rules?: Record<string, any>;

    @IsObject()
    @IsOptional()
    rewardConfig?: {
        topN?: number;
        rewards?: { position: number; description: string; value?: number }[];
    };

    @IsNumber()
    @IsOptional()
    maxParticipants?: number;
}

export class TournamentsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;

    @IsOptional()
    @IsEnum(['draft', 'scheduled', 'active', 'completed', 'cancelled'])
    status?: string;

    @IsOptional()
    @IsString()
    search?: string;
}
