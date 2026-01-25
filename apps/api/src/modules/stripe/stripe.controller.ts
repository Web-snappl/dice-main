import { Controller, ValidationPipe, Body } from '@nestjs/common';
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
}
