import { Controller, ValidationPipe, Body, Post } from '@nestjs/common';
import { CreateSellerDto, SellerResponse } from './createSeller.dto';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
    constructor(private readonly StripeService: StripeService) { }
    async createSellerAccount(@Body(ValidationPipe) createSellerDto: CreateSellerDto): Promise<SellerResponse> {
        return this.StripeService.CreateSeller(
            createSellerDto.uid,
            createSellerDto.firstName,
            createSellerDto.lastName,
            createSellerDto.email,
            createSellerDto.country
        );
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
