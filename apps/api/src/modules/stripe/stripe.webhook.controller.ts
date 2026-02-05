import { Controller, Post, Headers, Req, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/auth.mongoSchema';
import { Request } from 'express';

@Controller('stripe/webhook')
export class StripeWebhookController {
    constructor(
        private readonly stripeService: StripeService,
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
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                const uid = paymentIntent.metadata.uid;
                const type = paymentIntent.metadata.type;

                if (type === 'deposit' && uid) {
                    const amount = paymentIntent.amount / 100; // Convert cents to dollars
                    console.log(`Processing deposit for user ${uid}: $${amount}`);

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
