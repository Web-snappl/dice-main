import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameIssueDocument = GameIssue & Document;

@Schema({ timestamps: true })
export class GameIssue {
    @Prop({ required: true, index: true })
    gameId: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, enum: ['low', 'medium', 'high', 'critical'] })
    severity: string;

    @Prop({ required: true, enum: ['open', 'investigating', 'resolved', 'wont_fix'], default: 'open' })
    status: string;

    @Prop({ required: false })
    notes: string;

    @Prop({ required: true })
    createdBy: string;
}

export const GameIssueSchema = SchemaFactory.createForClass(GameIssue);
