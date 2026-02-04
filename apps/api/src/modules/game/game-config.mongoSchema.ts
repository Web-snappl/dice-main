import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameConfigDocument = GameConfig & Document;

@Schema({ timestamps: true })
export class GameConfig extends Document {
    @Prop({ required: true, unique: true })
    gameId: string; // 'dice_duel' | 'dice_table'

    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: 5 })
    commissionRate: number; // percentage (e.g., 5 = 5%)

    @Prop({ default: 50 })
    minBet: number;

    @Prop({ default: 10000 })
    maxBet: number;

    @Prop({ default: 2 })
    minPlayers: number;

    @Prop({ default: 2 })
    maxPlayers: number;

    @Prop({ default: 2 })
    payoutMultiplier: number; // e.g., 2x for duels

    @Prop({ default: null })
    dailyBetLimit: number | null; // per-user daily limit

    @Prop({ default: false })
    maintenanceMode: boolean;

    @Prop({ default: '' })
    maintenanceMessage: string;

    @Prop({ default: 'medium' })
    difficulty: string;
}

export const GameConfigSchema = SchemaFactory.createForClass(GameConfig);
