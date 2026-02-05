import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe.webhook.controller';
import { users } from '../auth/auth.mongoSchema';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'users', schema: users }]),
    TransactionsModule,
  ],
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeService]
})
export class StripeModule { }
