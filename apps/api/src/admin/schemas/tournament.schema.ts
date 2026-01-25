// src/admin/schemas/tournament.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TournamentStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';

@Schema({ timestamps: true })
export class Tournament extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: false })
    description: string;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop({ required: true, enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'], default: 'draft' })
    status: TournamentStatus;

    @Prop({ type: Object, required: false })
    rules: Record<string, any>;

    @Prop({ type: Object, required: false })
    rewardConfig: {
        topN?: number;
        rewards?: { position: number; description: string; value?: number }[];
    };

    @Prop({ required: false })
    gameConfigId: string;

    @Prop({ required: false })
    maxParticipants: number;

    @Prop({ type: [String], default: [] })
    participantIds: string[];

    @Prop({ required: true })
    createdBy: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);

// Indexes
TournamentSchema.index({ status: 1, startDate: 1 });
TournamentSchema.index({ endDate: 1 });
