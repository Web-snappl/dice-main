import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { users } from '../auth/auth.mongoSchema';
import { Deposit, depositSchema } from '../../common/deposits.mongoSchema';
import { gameHistory, GameHistoryModel } from '../../common/gameHistory.mongoSchema';
import { Withdrawal, WithdrawalSchema } from '../../common/withdrawals.mongoSchema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'users', schema: users },
            { name: Deposit.name, schema: depositSchema },
            { name: GameHistoryModel.name, schema: gameHistory },
            { name: Withdrawal.name, schema: WithdrawalSchema },
        ])
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService]
})
export class AdminModule { }
