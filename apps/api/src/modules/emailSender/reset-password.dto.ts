

import { IsEmail, IsString, Matches, MinLength } from 'class-validator'

const PASSWORD_RULES = {
    message: 'Password must include letters, numbers and special character(s)',
}

export class ResetPasswordDto {
    @IsString()
    @IsEmail()
    email: string

    @IsString({ message: 'Password must be a string' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/, PASSWORD_RULES)
    password: string
}

interface ResetPasswordReturnType {
    status: string
    message: string
}

interface Error {
    status: number
    message: string
}

export type ResetPasswordResponse = | ResetPasswordReturnType | Error

