import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Transaction extends Document {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: false })
    userName: string;

    @Prop({ required: true })
    type: string; // 'DEPOSIT', 'WITHDRAW', 'GAME_WIN', 'GAME_BET', 'GAME_REFUND', 'ADMIN_ADJUSTMENT'

    @Prop({ required: true })
    amount: number;

    @Prop({ default: Date.now })
    timestamp: Date;

    @Prop({ required: true })
    status: string; // 'SUCCESS', 'PENDING', 'FAILED'

    @Prop({ required: false })
    method: string; // 'STRIPE', 'BANK_TRANSFER', 'MANUAL', 'GAME'

    @Prop({ required: false })
    accountNumber: string;

    @Prop({ required: false })
    referenceId: string; // External Reference ID (MTN UUID, Stripe PI ID)

    @Prop({ required: false })
    providerTransactionId: string; // Provider payment identifier (e.g., Kkiapay transaction ID)

    @Prop({ required: false })
    currency: string; // ISO currency code

    @Prop({ required: false })
    verifiedAt: Date;

    @Prop({ required: false })
    adminNote: string;
}

export const transactionSchema = SchemaFactory.createForClass(Transaction);
transactionSchema.index({ userId: 1, type: 1, method: 1, referenceId: 1 });
transactionSchema.index({ type: 1, method: 1, providerTransactionId: 1, status: 1 });
