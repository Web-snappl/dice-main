import { IsString } from 'class-validator'
export class GameHistoryDto {
    @IsString()
    uid: string;

    @IsString()
    displayName: string;

    rollDiceResult: number
    winner: boolean
    winsAgainst: string[]
    dice1?: number
    dice2?: number
}

export interface HistoryList {
    onlineUsers: GameHistoryDto[]
}

export interface Error {
    status: number;
    message: string;
}

export type UserResponse = | HistoryList | Error
