import { IsString, IsEmail } from 'class-validator';

export class CreateSellerDto {
    @IsString()
    uid: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    country: string;
}

export interface CreateSellerReturnType {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    stripeAccountId?: string;
    isStripeConnected?: boolean;
    deferredOnboarding?: {
        hasMinimalAccount: boolean;
        pendingEarnings: number;
        earningsCount: number;
        onboardingNotificationSent: boolean;
    };
}

export interface AuthError {
    status: number;
    message: string;
}

export type SellerResponse = | CreateSellerReturnType | AuthError