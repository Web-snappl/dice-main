import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction, transactionSchema } from '../../common/transactions.mongoSchema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Transaction.name, schema: transactionSchema }]),
    ],
    controllers: [TransactionsController],
    providers: [TransactionsService],
    exports: [TransactionsService],
})
export class TransactionsModule { }
