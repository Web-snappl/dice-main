import { Controller, ValidationPipe, Body, Post } from '@nestjs/common';
import { CreateSellerDto, SellerResponse } from './createSeller.dto';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
    constructor(private readonly StripeService: StripeService) { }

    // Legacy endpoint, can be removed or kept for admin usage if needed
    async createSellerAccount(@Body(ValidationPipe) createSellerDto: CreateSellerDto): Promise<SellerResponse> {
        // This legacy method is not used in the new flow but kept for compatibility
        return { status: 400, message: 'Deprecated. Use /stripe/onboard' } as any;
    }

    @Post('onboard')
    async onboardUser(@Body() body: { uid: string, returnUrl: string, refreshUrl: string }) {
        return this.StripeService.onboardUser(body.uid, body.returnUrl, body.refreshUrl);
    }

    @Post('status')
    async getAccountStatus(@Body() body: { uid: string }) {
        return this.StripeService.getAccountStatus(body.uid);
    }

    @Post('create-deposit-intent')
    async createDepositIntent(@Body() body: { uid: string, amount: number }) {
        return this.StripeService.createDepositIntent(body.uid, body.amount);
    }

    @Post('create-login-link')
    async createLoginLink(@Body() body: { stripeAccountId: string }) {
        return this.StripeService.createLoginLink(body.stripeAccountId);
    }

    @Post('withdraw')
    async withdraw(@Body() body: { uid: string, amount: number }) {
        return this.StripeService.createWithdrawal(body.uid, body.amount);
    }
}
