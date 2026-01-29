import { Controller, Get, Post, Body, ValidationPipe } from '@nestjs/common';
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
    signup(@Body(ValidationPipe) userList: UserList): UserList {
        return this.gameService.rollDice(userList);
    }

    @Post('/preGuess/rollDice')
    preGuess(@Body(ValidationPipe) userList: GuessGameUserList): GuessGameUserList {
        return this.gameService.preGuessRollDice(userList)
    }

}
