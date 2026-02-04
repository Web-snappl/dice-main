import { Controller, Get, Post, Body, ValidationPipe, Patch, Param } from '@nestjs/common';
import { GameService } from './game.service';
import { GuessGameUserList, UserList, UserResponse } from './createUser.dto';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) { }

    @Get('searchPlayers')
    searchLivePlayers(): Promise<UserResponse> {
        return this.gameService.queryLiveUsers()
    }

    @Post('rollDice')
    async signup(@Body(ValidationPipe) userList: UserList): Promise<UserList> {
        return await this.gameService.rollDice(userList);
    }

    @Post('/preGuess/rollDice')
    preGuess(@Body(ValidationPipe) userList: GuessGameUserList): GuessGameUserList {
        return this.gameService.preGuessRollDice(userList)
    }

    // Game Configuration Endpoints
    @Get('configs')
    async getGameConfigs() {
        return this.gameService.getGameConfigs();
    }

    @Get('config/:gameId')
    async getGameConfig(@Param('gameId') gameId: string) {
        return this.gameService.getGameConfig(gameId);
    }

    @Patch('config/:gameId')
    async updateGameConfig(@Param('gameId') gameId: string, @Body() data: any) {
        return this.gameService.updateGameConfig(gameId, data);
    }

    @Post('config/seed')
    async seedGameConfigs() {
        return this.gameService.seedDefaultConfigs();
    }
}

