import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Transaction,
  transactionSchema,
} from '../../common/transactions.mongoSchema';
import { users } from '../auth/auth.mongoSchema';
import { StripeClientService } from './stripe-client.service';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe.webhook.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'users', schema: users },
      { name: Transaction.name, schema: transactionSchema },
    ]),
  ],
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeClientService, StripeService],
})
export class StripeModule {}
