import { IsString } from 'class-validator';
export class UserDto {
    @IsString()
    uid: string;

    @IsString()
    displayName: string;

    rollDiceResult?: number
    winner?: boolean
    winsAgainst?: string[]
    dice1?: number
    dice2?: number
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
