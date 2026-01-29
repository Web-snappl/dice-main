import { IsString, IsArray, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UserListItem {
    @IsString()
    uid: string;

    @IsString()
    @IsOptional()
    displayName?: string;

    @IsNumber()
    @IsOptional()
    rollDiceResult?: number;

    @IsNumber()
    @IsOptional()
    dice1?: number;

    @IsNumber()
    @IsOptional()
    dice2?: number;

    @IsBoolean()
    @IsOptional()
    winner?: boolean;

    @IsArray()
    @IsOptional()
    winsAgainst?: string[];
}

export type UserList = UserListItem[];

export class GuessGameUserListItem extends UserListItem {
    @IsArray()
    @IsNumber({}, { each: true })
    guess: number[];
}

export type GuessGameUserList = GuessGameUserListItem[];

export interface UserResponse {
    onlineUsers: any[];
}
