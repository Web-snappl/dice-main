import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LiveUser, LiveUserSchema } from './liveUser.mongoSchema';
import { gameHistory, GameHistoryModel } from 'src/common/gameHistory.mongoSchema';
import { users } from '../auth/auth.mongoSchema';
import { GameConfig, GameConfigSchema } from './game-config.mongoSchema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LiveUser.name, schema: LiveUserSchema },
      { name: GameHistoryModel.name, schema: gameHistory },
      { name: 'users', schema: users },
      { name: GameConfig.name, schema: GameConfigSchema },
    ])
  ],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule { }

