import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LiveUser, LiveUserSchema } from './liveUser.mongoSchema';
import { gameHistory, GameHistoryModel } from 'src/common/gameHistory.mongoSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LiveUser.name, schema: LiveUserSchema },
      { name: GameHistoryModel.name, schema: gameHistory },
    ])
  ],
  controllers: [GameController],
  providers: [GameService]
})
export class GameModule { }
