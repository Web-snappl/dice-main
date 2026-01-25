import { IsString, IsEmail } from 'class-validator';

export class MailSenderDto {
    @IsEmail()
    recipient: string;

    @IsString()
    subject: string;

    @IsString()
    body: string;
}

export interface MailReturnType {
    status: string;
    message: string
}

export interface AuthError {
    status: number;
    message: string;
}

export type MailSenderResponse = | MailReturnType | AuthError
