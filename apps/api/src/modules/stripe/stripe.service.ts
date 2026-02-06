import { Injectable, BadRequestException } from '@nestjs/common';
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

    async onboardUser(uid: string, returnUrl: string, refreshUrl: string) {
        try {
            let user = await this.userModel.findOne({ clerkUserId: uid });
            if (!user) {
                user = await this.userModel.findOne({ uid: uid });
            }
            // Fallback: Check if uid is a valid MongoDB _id and search by it
            if (!user && /^[0-9a-fA-F]{24}$/.test(uid)) {
                user = await this.userModel.findById(uid);
            }

            if (!user) throw new Error(`User not found for uid: ${uid}`);

            let accountId = user.stripeAccountId;

            // 1. Create Connect Account if not exists
            if (!accountId) {
                const account = await stripe.accounts.create({
                    type: "express",
                    country: "US", // Reverting to US as SN is not supported for Express
                    email: user.email,
                    capabilities: {
                        transfers: { requested: true },
                    },
                    settings: {
                        payouts: {
                            schedule: {
                                interval: "manual",
                            },
                        },
                    },
                    metadata: {
                        uid: uid,
                    }
                });
                accountId = account.id;
                user.stripeAccountId = accountId;
                user.isStripeConnected = false;
                await user.save();
            }

            // 2. Create Account Link for onboarding
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: refreshUrl,
                return_url: returnUrl,
                type: "account_onboarding",
            });

            return {
                url: accountLink.url,
                stripeAccountId: accountId
            };
        } catch (error) {
            console.error("Stripe Onboarding Error:", error);
            // Throwing BadRequestException makes the error message visible to the frontend
            throw new BadRequestException(`Stripe Connect Failed: ${error.message}`);
        }
    }

    async getAccountStatus(uid: string) {
        let user = await this.userModel.findOne({ clerkUserId: uid });
        if (!user) user = await this.userModel.findOne({ uid: uid });
        if (!user) throw new Error('User not found');

        if (!user.stripeAccountId) {
            return {
                isConnected: false,
                detailsSubmitted: false,
                payoutsEnabled: false,
            };
        }

        const account = await stripe.accounts.retrieve(user.stripeAccountId);

        const isConnected = account.details_submitted && account.payouts_enabled;

        // Update local status if changed
        if (user.isStripeConnected !== isConnected) {
            user.isStripeConnected = isConnected;
            await user.save();
        }

        return {
            isConnected: isConnected,
            detailsSubmitted: account.details_submitted,
            payoutsEnabled: account.payouts_enabled,
            currency: account.default_currency,
        };
    }

    async createDepositIntent(uid: string, amount: number, currency: string = 'xof') {
        const amountInCents = Math.round(amount);

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
        let user = await this.userModel.findOne({ clerkUserId: uid });
        if (!user) user = await this.userModel.findOne({ uid: uid });

        if (!user) throw new Error('User not found');

        if (!user.stripeAccountId) {
            throw new Error('No Connect account found. Please link your bank account first.');
        }

        // Check if account is actually capable of receiving transfers
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        if (!account.payouts_enabled) {
            throw new Error('Your bank account is not yet verified or ready for payouts. Please check your Stripe settings.');
        }

        if ((user.balance || 0) < amount) {
            throw new Error('Insufficient balance');
        }

        const amountInCents = Math.round(amount);

        // 1. Create PENDING Transaction Record
        await this.transactionsService.create({
            userId: uid,
            type: 'WITHDRAWAL',
            amount: amount,
            status: 'PENDING',
            method: 'STRIPE_CONNECT',
        });

        try {
            // 2. Optimistic Balance Deduct
            user.balance = (user.balance || 0) - amount;
            await user.save();

            // 3. Create Transfer
            const transfer = await stripe.transfers.create({
                amount: amountInCents,
                currency: "xof",
                destination: user.stripeAccountId,
                metadata: {
                    uid: uid,
                    type: 'withdrawal_payout'
                }
            });

            // 4. Update Transaction to SUCCESS
            await this.transactionsService.create({
                userId: uid,
                type: 'WITHDRAWAL',
                amount: amount,
                status: 'SUCCESS',
                method: 'STRIPE_CONNECT',
                adminNote: `Transfer ID: ${transfer.id}, Dest: ${user.stripeAccountId}`
            });

            return { success: true, transferId: transfer.id, newBalance: user.balance };
        } catch (error) {
            // Rollback if Stripe fails
            user.balance = (user.balance || 0) + amount;
            await user.save();

            // Mark transaction FAILED
            await this.transactionsService.create({
                userId: uid,
                type: 'WITHDRAWAL',
                amount: amount,
                status: 'FAILED',
                method: 'STRIPE_CONNECT',
                adminNote: `Error: ${error.message}`
            });

            throw error;
        }
    }

    // Helper to verify webhook signature
    constructEventFromPayload(signature: string, payload: Buffer) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
}
