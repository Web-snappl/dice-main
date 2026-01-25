// src/admin/schemas/reward.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RewardType = 'manual' | 'tournament' | 'achievement' | 'bonus';
export type RewardStatus = 'pending' | 'allocated' | 'claimed' | 'expired';

@Schema({ timestamps: true })
export class Reward extends Document {
    @Prop({ required: true })
    userId: string;

    @Prop({ required: false })
    userName: string;

    @Prop({ required: true, enum: ['manual', 'tournament', 'achievement', 'bonus'] })
    type: RewardType;

    @Prop({ required: true })
    description: string;

    @Prop({ required: false })
    value: number;

    @Prop({ required: false })
    currency: string;

    @Prop({ required: true, enum: ['pending', 'allocated', 'claimed', 'expired'], default: 'pending' })
    status: RewardStatus;

    @Prop({ required: false })
    tournamentId: string;

    @Prop({ required: false })
    position: number;

    @Prop({ required: true })
    allocatedBy: string;

    @Prop({ required: false })
    allocatedByName: string;

    @Prop({ required: false })
    notes: string;

    @Prop({ required: false })
    expiresAt: Date;

    @Prop({ required: false })
    claimedAt: Date;

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

// Indexes
RewardSchema.index({ userId: 1, status: 1 });
RewardSchema.index({ tournamentId: 1 });
RewardSchema.index({ allocatedBy: 1 });
