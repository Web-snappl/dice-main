import { IsString, IsEmail, IsIn, MinLength, Matches } from 'class-validator';

type UserRole = 'user' | 'User' | 'admin' | 'Admin'

const PASSWORD_RULES = {
    message: 'Password must include letters, numbers and special character(s)',
}
export class UserDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @IsString({ message: 'Password must be a string' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/, PASSWORD_RULES)
    password: string;

    @IsString()
    displayName: string;

    @IsString()
    @IsIn(['user', 'User', 'admin', 'Admin'], { message: 'role must be user or admin' })
    role: UserRole
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export interface UserReturnType {
    uid: string;
    displayName: string;
    email: string;
    role: UserRole;
    photoURL?: string;
}

export interface AuthError {
    status: number;
    message: string;
}

export type UserResponse = | UserReturnType | AuthError