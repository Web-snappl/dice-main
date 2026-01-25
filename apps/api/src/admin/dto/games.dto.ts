// src/admin/dto/games.dto.ts
import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGameConfigDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;

    @IsNumber()
    @IsOptional()
    minPlayers?: number = 2;

    @IsNumber()
    @IsOptional()
    maxPlayers?: number = 10;

    @IsEnum(['easy', 'medium', 'hard'])
    @IsOptional()
    difficulty?: string = 'medium';

    @IsString()
    @IsOptional()
    mode?: string;

    @IsObject()
    @IsOptional()
    rulesJson?: Record<string, any>;

    @IsString()
    @IsOptional()
    iconUrl?: string;
}

export class UpdateGameConfigDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsNumber()
    @IsOptional()
    minPlayers?: number;

    @IsNumber()
    @IsOptional()
    maxPlayers?: number;

    @IsEnum(['easy', 'medium', 'hard'])
    @IsOptional()
    difficulty?: string;

    @IsString()
    @IsOptional()
    mode?: string;

    @IsObject()
    @IsOptional()
    rulesJson?: Record<string, any>;

    @IsString()
    @IsOptional()
    iconUrl?: string;
}

export class GamesQueryDto {
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
    search?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isActive?: boolean;
}
