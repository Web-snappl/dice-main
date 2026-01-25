// src/modules/deposits/deposits.dto.ts
import { IsString, IsMongoId, IsNumberString, IsBoolean } from 'class-validator';

export class DepositDto {
    @IsString()
    @IsMongoId()
    uid: string;

    @IsString()
    displayName: string;

    @IsNumberString()
    amount: string;

    @IsBoolean()
    vip: boolean;
}

export class DepositWithId {
    @IsString()
    depositId: string;
}

export interface DepositResponse {
    status: number;
    message: string;
    depositId?: string;
}

export type CreateDepositDto = DepositDto;
export type UpdateDepositDto = DepositDto & DepositWithId;