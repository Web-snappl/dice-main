import { Injectable } from '@nestjs/common';
import { SellerResponse } from './createSeller.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.mongoSchema';

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
    apiVersion: "2025-02-24.acacia",
});

@Injectable()
export class StripeService {
    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
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
            displayName: user.displayName,
            email: user.email,
            stripeAccountId: accountId,
            isStripeConnected: user.isStripeConnected,
            deferredOnboarding: user.deferredOnboarding,
        };
    }
}
