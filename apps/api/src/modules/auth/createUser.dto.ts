import { IsString, IsEmail, IsIn, MinLength, Matches, IsNumber, IsOptional } from 'class-validator';

type UserRole = 'user' | 'User' | 'moderator' | 'admin' | 'Admin'

const PASSWORD_RULES = {
    message: 'Password must include letters, numbers and special character(s)',
}
export class UserDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @IsOptional()
    email?: string;

    @IsString({ message: 'Password must be a string' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/, PASSWORD_RULES)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    phoneNumber: string;

    @IsString()
    @IsIn(['user', 'User', 'admin', 'Admin'], { message: 'role must be user or admin' })
    @IsOptional()
    role?: UserRole
}

export class LoginDto {
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    password: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    firstame: string;

    @IsString()
    @IsOptional()
    lastName: string;

    @IsString()
    @IsOptional()
    role?: string;
}

export interface UserReturnType {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: UserRole;
    photoURL?: string;
    balance?: number;
}

export interface AuthError {
    status: number;
    message: string;
}

export type UserResponse = | UserReturnType | AuthError