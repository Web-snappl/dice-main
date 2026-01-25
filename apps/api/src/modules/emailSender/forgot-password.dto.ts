

import { IsString, IsEmail, MinLength, Matches } from 'class-validator'

const PASSWORD_RULES = {
    message: 'Password must include letters, numbers and special character(s)',
}

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @IsString({ message: 'Password must be a string' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/, PASSWORD_RULES)
    newPassword: string;

    @IsString()
    confirmPassword: string;
}

interface ForgotPasswordReturnType {
    status: string;
    message: string
    verificationCode: number
}

interface AuthError {
    status: number;
    message: string;
}

export type ForgotPasswordResponse = | ForgotPasswordReturnType | AuthError

