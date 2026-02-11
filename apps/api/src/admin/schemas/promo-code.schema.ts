import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class PromoCode extends Document {
    @Prop({ required: true, unique: true, uppercase: true })
    code: string;

    @Prop({ required: true })
    bonusAmount: number;

    @Prop({ required: false, default: 0 })
    maxUses: number; // 0 = unlimited

    @Prop({ required: false, default: 0 })
    currentUses: number;

    @Prop({ required: false, default: true })
    isActive: boolean;

    @Prop({ required: false })
    expiresAt: Date;

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);
