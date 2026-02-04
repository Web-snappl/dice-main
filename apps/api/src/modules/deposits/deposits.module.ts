import { Module } from '@nestjs/common';
import { DepositsController } from './deposits.controller';
import { DepositsService } from './deposits.service';
import { Deposit, depositSchema } from 'src/common/deposits.mongoSchema';
import { gameHistory, GameHistoryModel } from 'src/common/gameHistory.mongoSchema';
import { users } from '../auth/auth.mongoSchema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deposit.name, schema: depositSchema },
      { name: GameHistoryModel.name, schema: gameHistory },
      { name: 'users', schema: users },
    ])
  ],
  controllers: [DepositsController],
  providers: [DepositsService]
})
export class DepositsModule { }
