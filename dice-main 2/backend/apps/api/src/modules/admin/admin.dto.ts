import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class AdminLoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class UpdateUserDto {
    @IsOptional()
    @IsNumber()
    balance?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    role?: string;
}
