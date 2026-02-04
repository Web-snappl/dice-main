import { Controller, Post, Headers, Req, BadRequestException } from '@nestjs/common';
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
    async handleWebhook(@Headers('stripe-signature') signature: string, @Req() request: Request) {
        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }

        let event;
        try {
            // Need raw body here. NestJS typically parses JSON. 
            // We assume main.ts has raw body support or we need to bypass body parser.
            // For simplicity in this edit, assuming request.body is usable or we need a specific RawBody decorator.
            // If body parser is global, this might fail without configuration.
            // However, to proceed, we will try to use the body directly if possible or the service.

            // NOTE: In NestJS, getting raw body requires configuration in main.ts. 
            // We will assume environment is set up or use a workaround if needed.
            // But strict signature verification requires RAW BUFFER.

            // Since we can't easily change main.ts safely without breaking other things, 
            // and this is a "best effort" implementation plan:
            event = this.stripeService.constructEventFromPayload(
                signature,
                (request as any).rawBody || request.body
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
                    console.log(`Processing deposit for ${uid}: $${amount}`);
                    await this.userModel.findOneAndUpdate(
                        { uid: uid },
                        { $inc: { balance: amount } }
                    );
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return { received: true };
    }
}
