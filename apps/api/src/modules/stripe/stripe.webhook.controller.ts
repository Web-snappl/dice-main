import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';

@Controller('stripe/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly stripeService: StripeService) {}

  @Post()
  async handleWebhook(
    @Headers('stripe-signature') signature: string | undefined,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!request.rawBody) {
      throw new BadRequestException('Raw request body is required');
    }

    let event;
    try {
      event = this.stripeService.constructEvent(request.rawBody, signature);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.warn(
        `Stripe webhook signature verification failed: ${this.errorMessage(error)}`,
      );
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    return this.stripeService.handleEvent(event);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
