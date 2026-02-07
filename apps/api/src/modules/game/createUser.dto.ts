import { IsBoolean, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
export class UserDto {
    @IsString()
    uid: string;

    @IsString()
    displayName: string;

    @IsOptional()
    @IsString()
    gameId?: string;

    @IsOptional()
    @IsObject()
    bets?: Record<string, number>;

    @IsOptional()
    @IsNumber()
    rollDiceResult?: number

    @IsOptional()
    @IsBoolean()
    winner?: boolean

    @IsOptional()
    @IsString({ each: true })
    winsAgainst?: string[]

    @IsOptional()
    @IsNumber()
    dice1?: number

    @IsOptional()
    @IsNumber()
    dice2?: number

    @IsOptional()
    @IsNumber()
    betAmount?: number
}

export type GuessGameUser = UserDto & {
    guess: number[]
}

export interface UserReturnType {
    onlineUsers: UserDto[]
}

export interface AuthError {
    status: number;
    message: string;
}

export type UserList = UserDto[]

export type GuessGameUserList = GuessGameUser[]

export type UserResponse = | UserReturnType | AuthError
