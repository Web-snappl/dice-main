import { Body, Controller, Get, Headers, Logger, Param, Post, RawBodyRequest, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtUserGuard } from '../auth/guards/jwt-user.guard';
import { FedapayService } from './fedapay.service';
import { CreateFedapayDepositIntentDto, CreateFedapayWithdrawalDto, VerifyFedapayDepositDto } from './fedapay.dto';

@Controller('fedapay')
export class FedapayController {
    private readonly logger = new Logger(FedapayController.name);

    constructor(private readonly fedapayService: FedapayService) { }

    @UseGuards(JwtUserGuard)
    @Post('deposit-intent')
    async createDepositIntent(@Req() req, @Body() body: CreateFedapayDepositIntentDto) {
        this.logger.log(`Creating FedaPay deposit intent user=${req.user.userId} amount=${body.amount}`);
        return this.fedapayService.createDepositIntent(req.user.userId, body.amount, body.phoneNumber);
    }

    @UseGuards(JwtUserGuard)
    @Post('verify')
    async verify(@Req() req, @Body() body: VerifyFedapayDepositDto) {
        this.logger.log(`FedaPay verify user=${req.user.userId} tx=${body.transactionId} ref=${body.referenceId}`);
        return this.fedapayService.processDeposit(req.user.userId, body.transactionId, body.referenceId);
    }

    @UseGuards(JwtUserGuard)
    @Get('deposit-status/:referenceId')
    async getDepositStatus(@Req() req, @Param('referenceId') referenceId: string) {
        return this.fedapayService.getDepositStatus(req.user.userId, referenceId);
    }

    @UseGuards(JwtUserGuard)
    @Post('withdraw')
    async withdraw(@Req() req, @Body() body: CreateFedapayWithdrawalDto) {
        this.logger.log(`FedaPay withdrawal user=${req.user.userId} amount=${body.amount}`);
        return this.fedapayService.requestWithdrawal(req.user.userId, body.amount, body.phoneNumber, body.requestId);
    }

    @Post('webhook')
    async webhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-fedapay-signature') signature?: string,
    ) {
        const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body);
        this.logger.log('Received FedaPay webhook');
        return this.fedapayService.handleWebhook(rawBody, signature);
    }

    // Public return endpoint hit by FedaPay's hosted checkout after payment. The mobile
    // WebView intercepts navigation to this URL and closes the payment flow.
    @Get('return')
    paymentReturn(@Res() res: Response) {
        res.type('html').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Payment complete</title></head>
<body style="font-family:sans-serif;text-align:center;padding:48px;background:#121212;color:#fff;">
<h2>Payment complete</h2>
<p>You can return to the app.</p>
</body></html>`);
    }
}
