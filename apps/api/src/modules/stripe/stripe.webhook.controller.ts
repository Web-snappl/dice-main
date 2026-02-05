import { Controller, Post, Headers, Req, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/auth.mongoSchema';
import { Request } from 'express';
import { TransactionsService } from '../transactions/transactions.service';

@Controller('stripe/webhook')
export class StripeWebhookController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly transactionsService: TransactionsService,
        @InjectModel('users') private readonly userModel: Model<User>,
    ) { }

    @Post()
    async handleWebhook(
        @Headers('stripe-signature') signature: string,
        @Req() request: RawBodyRequest<Request>
    ) {
        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }

        let event;
        try {
            // Use rawBody from RawBodyRequest for signature verification
            const rawBody = request.rawBody;
            if (!rawBody) {
                throw new BadRequestException('Raw body not available');
            }

            event = this.stripeService.constructEventFromPayload(
                signature,
                rawBody
            );
        } catch (err) {
            console.error(`Webhook Error: ${err.message}`);
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'account.updated':
                const account = event.data.object;
                const stripeAccountId = account.id;
                console.log(`Received account.updated for ${stripeAccountId}`);

                // Find user by stripeAccountId
                const user = await this.userModel.findOne({ stripeAccountId: stripeAccountId });
                if (user) {
                    const isConnected = account.details_submitted && account.payouts_enabled;
                    if (user.isStripeConnected !== isConnected) {
                        user.isStripeConnected = isConnected;
                        await user.save();
                        console.log(`✅ Updated User ${user._id} connection status to ${isConnected}`);
                    }
                } else {
                    console.warn(`User not found for Stripe Account ${stripeAccountId}`);
                }
                break;

            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const uid = paymentIntent.metadata.uid;
                const type = paymentIntent.metadata.type;
                // ... (existing logic)
                if (type === 'deposit' && uid) {
                    // ... (existing deposit logic)

                    const amount = paymentIntent.amount; // XOF is zero-decimal, no conversion needed
                    console.log(`Processing deposit for user ${uid}: ${amount} CFA`);

                    // Create Transaction Record
                    await this.transactionsService.create({
                        userId: uid,
                        userName: '', // Can be fetched if needed
                        type: 'DEPOSIT',
                        amount: amount,
                        status: 'SUCCESS',
                        method: 'STRIPE'
                    });

                    // uid is the MongoDB _id passed when creating payment intent
                    const result = await this.userModel.findByIdAndUpdate(
                        uid,
                        { $inc: { balance: amount } },
                        { new: true }
                    );

                    if (result) {
                        console.log(`✅ Balance updated for ${uid}. New balance: ${result.balance}`);
                    } else {
                        console.error(`❌ User not found: ${uid}`);
                    }
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return { received: true };
    }
}
