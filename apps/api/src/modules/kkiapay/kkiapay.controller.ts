import { Body, Controller, Get, Headers, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtUserGuard } from '../auth/guards/jwt-user.guard';
import { KkiapayService } from './kkiapay.service';
import { CreateKkiapayDepositIntentDto, CreateKkiapayWithdrawalDto, VerifyKkiapayDepositDto } from './kkiapay.dto';

@Controller('kkiapay')
export class KkiapayController {
    private readonly logger = new Logger(KkiapayController.name);

    constructor(private readonly kkiapayService: KkiapayService) { }

    @UseGuards(JwtUserGuard)
    @Post('deposit-intent')
    async createDepositIntent(@Req() req, @Body() body: CreateKkiapayDepositIntentDto) {
        this.logger.log(`Creating Kkiapay deposit intent for user ${req.user.userId}, amount=${body.amount}`);
        return await this.kkiapayService.createDepositIntent(req.user.userId, body.amount, body.phoneNumber);
    }

    @UseGuards(JwtUserGuard)
    @Post('verify')
    async verify(@Req() req, @Body() body: VerifyKkiapayDepositDto) {
        this.logger.log(`Received Kkiapay verification for tx=${body.transactionId}, ref=${body.referenceId}, user=${req.user.userId}`);
        return await this.kkiapayService.processDeposit(req.user.userId, body.transactionId, body.referenceId);
    }

    @UseGuards(JwtUserGuard)
    @Get('deposit-status/:referenceId')
    async getDepositStatus(@Req() req, @Param('referenceId') referenceId: string) {
        return await this.kkiapayService.getDepositStatus(req.user.userId, referenceId);
    }

    @UseGuards(JwtUserGuard)
    @Post('withdraw')
    async withdraw(@Req() req, @Body() body: CreateKkiapayWithdrawalDto) {
        this.logger.log(`Received withdrawal request from user ${req.user.userId}: ${body.amount}`);
        return await this.kkiapayService.requestWithdrawal(req.user.userId, body.amount, body.phoneNumber, body.requestId);
    }

    @Post('webhook')
    async webhook(
        @Body() payload: Record<string, any>,
        @Headers('x-kkiapay-secret') signature?: string,
    ) {
        this.logger.log(`Received Kkiapay webhook event=${payload?.event || payload?.type || 'unknown'}`);
        return await this.kkiapayService.handleWebhook(payload, signature);
    }
}
