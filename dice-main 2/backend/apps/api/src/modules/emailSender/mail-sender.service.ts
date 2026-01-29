import { BadRequestException, Injectable } from '@nestjs/common'
import axios from 'axios'
import { MailSenderResponse } from './mail-sender.dto'
import { getRandomInt } from 'src/common/random'
import { ForgotPasswordResponse } from './forgot-password.dto';
import { ResetPasswordResponse } from './reset-password.dto';
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User } from '../auth/auth.mongoSchema'
import { createHmac } from 'node:crypto'

@Injectable()
export class MailSenderService {

    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
    ) { }

    async sendEmail(recipient: string, subject: string, body: string): Promise<MailSenderResponse> {
        const data = JSON.stringify({
            "recipient": recipient,
            "subject": subject,
            "body": body
        });

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://script.google.com/macros/s/AKfycbwJtIApIZbILfOL677XF6Dea_uZBx5Mdksv5A4WhxYlDAZEAE855JQvXmmdq5ZXAypF7g/exec',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        try {
            const response = await axios.request(config)
            const data = response.data;
            return {
                status: data?.status || '200',
                message: data?.message || 'email sent successfully'
            }
        } catch (e) {
            return {
                status: e?.response?.data?.status || 500,
                message: e?.response?.data?.message || 'Failed to send email'
            }
        }
    }

    async forgotPassword(email: string, newPassword: string, confirmNewPassword: string): Promise<ForgotPasswordResponse> {

        if (newPassword !== confirmNewPassword) throw new BadRequestException('New password and confirm new password do not match')

        const randomInt = getRandomInt(1, 1000000)

        await this.sendEmail(
            email,
            'Password Reset Notification',
            `\n Your verification code: \n\n   ${randomInt}  \n\n  If you did not request this change, please contact support immediately.`
        )

        return {
            status: '200',
            message: 'Verification code sent to email',
            verificationCode: randomInt
        }
    }

    encrypt(password: string): string {
        const encryption = createHmac('sha256', process.env.CRYPTOGRAPHY_SECRET).update(password).digest('hex')
        return encryption
    }

    async resetPassword(email: string, password: string): Promise<ResetPasswordResponse> {
        try {
            const resp = await this.userModel.updateOne(
                { email: email },
                { $set: { password: this.encrypt(password) } }
            ).exec()

            if (resp.matchedCount === 0) throw new BadRequestException('No user found with the provided email')

            return {
                status: '200',
                message: 'Password reset successfully'
            }
        } catch (error) {
            throw new BadRequestException('Server error resetting password in database')
        }
    }

}
