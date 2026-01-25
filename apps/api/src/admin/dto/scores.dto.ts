// src/admin/dto/scores.dto.ts
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ScoresQueryDto {
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
    userId?: string;

    @IsOptional()
    @IsString()
    gameId?: string;
}

export class RankingsQueryDto {
    @IsOptional()
    @IsEnum(['global', 'weekly', 'monthly'])
    period?: string = 'global';

    @IsOptional()
    @IsString()
    gameId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 100;
}

export class ResetScoreDto {
    @IsString()
    reason: string;
}
