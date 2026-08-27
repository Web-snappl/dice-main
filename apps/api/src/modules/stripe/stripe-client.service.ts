import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeClientService {
  private client: Stripe | null = null;

  constructor(private readonly configService: ConfigService) {}

  getClient(): Stripe {
    if (this.client) {
      return this.client;
    }

    const secretKey = this.configService
      .get<string>('STRIPE_SECRET_KEY')
      ?.trim();
    if (!secretKey) {
      throw new ServiceUnavailableException(
        'Stripe payments are not configured',
      );
    }

    this.client = new Stripe(secretKey);
    return this.client;
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService
      .get<string>('STRIPE_WEBHOOK_SECRET')
      ?.trim();
    if (!webhookSecret) {
      throw new ServiceUnavailableException('Stripe webhook is not configured');
    }

    return this.getClient().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
