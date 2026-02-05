import { Injectable } from '@nestjs/common';
import { SellerResponse } from './createSeller.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/auth.mongoSchema';
import { TransactionsService } from '../transactions/transactions.service';

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2025-02-24.acacia",
});

@Injectable()
export class StripeService {
    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
        private readonly transactionsService: TransactionsService,
    ) { }
    async CreateSeller(uid: string, firstName: string, lastName: string, email: string, country: string): Promise<SellerResponse> {
        // check mongodb user collection for user.stripeAccountId

        const user = await this.userModel.findOne({ clerkUserId: uid });
        // if exists, return error
        if (!user) return { status: 400, message: 'User not found' };
        if (user.stripeAccountId) {
            return { status: 400, message: 'Seller account already exists' };
        }
        // if doesnt exist, create stripe express account with minimal info

        const account = await stripe.accounts.create({
            type: "express",
            country: country,
            email: email,
            business_type: "individual",

            // Request minimal capabilities
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },

            // Business profile (required for Express accounts)
            business_profile: {
                product_description: "Online marketplace sales",
                mcc: "5699", // Miscellaneous specialty retail
            },

            // KEY: Set manual payouts until full onboarding complete
            settings: {
                payouts: {
                    schedule: {
                        interval: "manual", // Prevents automatic payouts
                    },
                },
            },

            // Minimal individual info (optional but helpful)
            ...(firstName &&
                lastName && {
                individual: {
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    address: {
                        country: country,
                    },
                },
            }),

            // Metadata for tracking
            metadata: {
                onboarding_type: "deferred",
                platform_user_id: uid,
            },
        });

        const accountId = account.id;

        // Update user document
        user.stripeAccountId = accountId;
        user.isStripeConnected = false; // Not fully connected for payouts yet

        // Initialize deferred onboarding tracking
        user.deferredOnboarding = {
            hasMinimalAccount: true,
            pendingEarnings: 0,
            earningsCount: 0,
            onboardingNotificationSent: false,
        };

        await user.save();

        return {
            uid: uid,
            displayName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            stripeAccountId: accountId,
            isStripeConnected: user.isStripeConnected,
            deferredOnboarding: user.deferredOnboarding,
        };
    }


    async createDepositIntent(uid: string, amount: number, currency: string = 'usd') {
        // Amount in cents
        const amountInCents = Math.round(amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency,
            metadata: {
                uid: uid,
                type: 'deposit'
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Create Pending Transaction
        await this.transactionsService.create({
            userId: uid,
            type: 'DEPOSIT',
            amount: amount,
            status: 'PENDING',
            method: 'STRIPE',
            adminNote: `PaymentIntent: ${paymentIntent.id}`
        });

        return {
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id
        };
    }

    async createLoginLink(stripeAccountId: string) {
        const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
        return loginLink;
    }

    async createWithdrawal(uid: string, amount: number) {
        const user = await this.userModel.findOne({ uid: uid }); // uid in mongoSchema is just 'uid' usually, check consistency
        if (!user) throw new Error('User not found');

        if (!user.stripeAccountId) {
            throw new Error('No Stripe Connect account found');
        }

        if ((user.balance || 0) < amount) {
            throw new Error('Insufficient balance');
        }

        // Amount in cents
        const amountInCents = Math.round(amount * 100);

        // Create a Transfer to the connected account
        const transfer = await stripe.transfers.create({
            amount: amountInCents,
            currency: "usd",
            destination: user.stripeAccountId,
            metadata: {
                uid: uid,
                type: 'withdrawal'
            }
        });

        // Deduct balance immediately (optimistic)
        // In a real app, strict transactions needed.
        user.balance = (user.balance || 0) - amount;
        await user.save();

        return {
            transferId: transfer.id,
            newBalance: user.balance
        };
    }

    // Helper to verify webhook signature
    constructEventFromPayload(signature: string, payload: Buffer) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
}
