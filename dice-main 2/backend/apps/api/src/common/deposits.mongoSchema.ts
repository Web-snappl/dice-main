// src/common/deposits.mongoSchema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Deposit extends Document {
    @Prop({ required: true })
    uid: string;

    @Prop({ required: true })
    displayName: string;

    @Prop({ required: true, type: Number })
    amount: number;

    @Prop({ required: true, default: false })
    vip: boolean;

    @Prop({ default: Date.now })
    timestamp: Date;
}

export const depositSchema = SchemaFactory.createForClass(Deposit);