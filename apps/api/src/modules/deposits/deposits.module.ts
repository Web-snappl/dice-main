import { Module } from '@nestjs/common';
import { DepositsController } from './deposits.controller';
import { DepositsService } from './deposits.service';
import { Deposit, depositSchema } from 'src/common/deposits.mongoSchema';
import { gameHistory, GameHistoryModel } from 'src/common/gameHistory.mongoSchema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Deposit.name, schema: depositSchema },
      { name: GameHistoryModel.name, schema: gameHistory },
    ])
  ],
  controllers: [DepositsController],
  providers: [DepositsService]
})
export class DepositsModule { }
