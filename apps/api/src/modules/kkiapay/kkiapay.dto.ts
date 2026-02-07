import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateKkiapayDepositIntentDto {
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    amount: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    phoneNumber?: string;
}

export class VerifyKkiapayDepositDto {
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @IsString()
    @IsNotEmpty()
    referenceId: string;
}

export class CreateKkiapayWithdrawalDto {
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    amount: number;

    @IsString()
    @Matches(/^\+?[0-9]{8,15}$/, {
        message: 'phoneNumber must contain 8-15 digits and may start with +',
    })
    phoneNumber: string;

    @IsOptional()
    @IsString()
    @MaxLength(128)
    @Matches(/^[A-Za-z0-9_-]+$/, {
        message: 'requestId may only contain letters, numbers, underscore, and hyphen',
    })
    requestId?: string;
}
