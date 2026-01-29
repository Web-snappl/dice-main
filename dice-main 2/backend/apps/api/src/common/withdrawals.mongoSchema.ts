// src/common/withdrawals.mongoSchema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Withdrawal extends Document {
    @Prop({ required: true })
    uid: string;

    @Prop({ required: true })
    displayName: string;

    @Prop({ required: true, type: Number })
    amount: number;

    @Prop({ required: true })
    mobileNumber: string;

    @Prop({ required: true, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' })
    status: string;

    @Prop({ required: true })
    method: string;

    @Prop()
    adminNote?: string;

    @Prop({ default: Date.now })
    timestamp: Date;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
