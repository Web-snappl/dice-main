import { Controller, Post, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { JwtUserGuard } from '../auth/guards/jwt-user.guard';
import { KkiapayService } from './kkiapay.service';

@Controller('kkiapay')
export class KkiapayController {
    private readonly logger = new Logger(KkiapayController.name);

    constructor(private readonly kkiapayService: KkiapayService) { }

    @UseGuards(JwtUserGuard)
    @Post('verify')
    async verify(@Req() req, @Body() body: { transactionId: string }) {
        this.logger.log(`Received verification request for tx: ${body.transactionId} from user ${req.user.userId}`);
        return await this.kkiapayService.processDeposit(req.user.userId, body.transactionId);
    }

    @UseGuards(JwtUserGuard)
    @Post('withdraw')
    async withdraw(@Req() req, @Body() body: { amount: number; phoneNumber: string }) {
        this.logger.log(`Received withdrawal request from user ${req.user.userId}: ${body.amount} to ${body.phoneNumber}`);
        return await this.kkiapayService.requestWithdrawal(req.user.userId, body.amount, body.phoneNumber);
    }
}
