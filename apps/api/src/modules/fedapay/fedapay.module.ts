import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FedapayController } from './fedapay.controller';
import { FedapayService } from './fedapay.service';
import { users } from '../auth/auth.mongoSchema';
import { Transaction, transactionSchema } from '../../common/transactions.mongoSchema';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: 'users', schema: users },
            { name: Transaction.name, schema: transactionSchema },
        ]),
    ],
    controllers: [FedapayController],
    providers: [FedapayService],
    exports: [FedapayService],
})
export class FedapayModule { }
