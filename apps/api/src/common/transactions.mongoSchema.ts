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
    adminNote: string;
}

export const transactionSchema = SchemaFactory.createForClass(Transaction);
