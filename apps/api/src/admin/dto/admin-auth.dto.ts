// src/admin/dto/admin-auth.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}

export class AdminRefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class AdminSetPasswordDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;
}
