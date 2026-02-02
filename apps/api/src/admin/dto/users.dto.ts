// src/admin/dto/users.dto.ts
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, MinLength, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsEnum(['user', 'moderator', 'admin'])
    @IsOptional()
    role?: string;
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsEnum(['user', 'moderator', 'admin'])
    @IsOptional()
    role?: string;

    @IsEnum(['active', 'suspended', 'banned'])
    @IsOptional()
    status?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    balance?: number;
}

export class SuspendUserDto {
    @IsString()
    @IsNotEmpty()
    reason: string;
}

export class BanUserDto {
    @IsString()
    @IsNotEmpty()
    reason: string;
}

export class UsersQueryDto {
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
    @IsEnum(['user', 'moderator', 'admin'])
    role?: string;

    @IsOptional()
    @IsEnum(['active', 'suspended', 'banned'])
    status?: string;
}
