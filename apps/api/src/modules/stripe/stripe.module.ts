import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe.webhook.controller';
import { users } from '../auth/auth.mongoSchema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'users', schema: users }])
  ],
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeService]
})
export class StripeModule { }
