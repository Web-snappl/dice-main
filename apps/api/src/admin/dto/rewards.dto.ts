// src/admin/dto/rewards.dto.ts
import { IsString, IsOptional, IsEnum, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRewardDto {
    @IsString()
    userId: string;

    @IsString()
    @IsOptional()
    userName?: string;

    @IsEnum(['manual', 'tournament', 'achievement', 'bonus'])
    type: string;

    @IsString()
    description: string;

    @IsNumber()
    @IsOptional()
    value?: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    tournamentId?: string;

    @IsNumber()
    @IsOptional()
    position?: number;

    @IsString()
    @IsOptional()
    notes?: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    expiresAt?: Date;
}

export class UpdateRewardDto {
    @IsEnum(['pending', 'allocated', 'claimed', 'expired'])
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class RewardsQueryDto {
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
    @IsEnum(['pending', 'allocated', 'claimed', 'expired'])
    status?: string;

    @IsOptional()
    @IsEnum(['manual', 'tournament', 'achievement', 'bonus'])
    type?: string;
}
