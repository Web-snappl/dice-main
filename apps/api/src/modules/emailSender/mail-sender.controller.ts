import { Body, Controller, Post, ValidationPipe } from '@nestjs/common'
import { MailSenderService } from './mail-sender.service'
import { MailSenderDto, MailSenderResponse } from './mail-sender.dto'
import { ForgotPasswordDto, ForgotPasswordResponse } from './forgot-password.dto'
import { ResetPasswordDto, ResetPasswordResponse } from './reset-password.dto'

@Controller('mailSender')
export class MailSenderController {
    constructor(private readonly mailSenderService: MailSenderService) { }

    @Post('sendEmail')
    sendEmail(@Body(ValidationPipe) mailDto: MailSenderDto): Promise<MailSenderResponse> {
        return this.mailSenderService.sendEmail(mailDto.recipient, mailDto.subject, mailDto.body)
    }

    @Post('forgotPassword')
    forgotPassword(@Body(ValidationPipe) forgotPassDto: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
        return this.mailSenderService.forgotPassword(forgotPassDto.email, forgotPassDto.newPassword, forgotPassDto.confirmPassword)
    }

    @Post('resetPassword')
    resetPassword(@Body(ValidationPipe) resetPassDto: ResetPasswordDto): Promise<ResetPasswordResponse> {
        return this.mailSenderService.resetPassword(resetPassDto.email, resetPassDto.password)
    }
}
