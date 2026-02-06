import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MtnService } from './mtn.service';
import { MtnController } from './mtn.controller';
import { MtnWebhookController } from './mtn.webhook.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { users } from '../auth/auth.mongoSchema';

@Module({
    imports: [
        TransactionsModule,
        MongooseModule.forFeature([{ name: 'users', schema: users }])
    ],
    controllers: [MtnController, MtnWebhookController],
    providers: [MtnService],
    exports: [MtnService]
})
export class MtnModule { }
