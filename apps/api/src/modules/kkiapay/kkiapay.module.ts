import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { KkiapayController } from './kkiapay.controller';
import { KkiapayService } from './kkiapay.service';
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
    controllers: [KkiapayController],
    providers: [KkiapayService],
    exports: [KkiapayService],
})
export class KkiapayModule { }
