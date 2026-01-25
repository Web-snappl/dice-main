// src/admin/schemas/game-config.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Neutral game config - no betting/gambling fields per requirements
@Schema({ timestamps: true })
export class GameConfig extends Document {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: false })
    description: string;

    @Prop({ required: true, default: true })
    isActive: boolean;

    @Prop({ required: true, default: 2 })
    minPlayers: number;

    @Prop({ required: true, default: 10 })
    maxPlayers: number;

    @Prop({ required: false, enum: ['easy', 'medium', 'hard'], default: 'medium' })
    difficulty: string;

    @Prop({ required: false })
    mode: string;

    @Prop({ type: Object, required: false })
    rulesJson: Record<string, any>;

    @Prop({ required: false })
    iconUrl: string;

    @Prop({ required: false })
    createdBy: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const GameConfigSchema = SchemaFactory.createForClass(GameConfig);
