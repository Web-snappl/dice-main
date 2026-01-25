// src/admin/schemas/analytics-event.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Minimal event tracking for basic analytics
// Mark dashboard cards as "requires event tracking" where data is missing
@Schema({ timestamps: true })
export class AnalyticsEvent extends Document {
    @Prop({ required: true })
    eventType: string; // 'session_start', 'session_end', 'game_played', 'login', etc.

    @Prop({ required: false })
    userId: string;

    @Prop({ required: false })
    sessionId: string;

    @Prop({ required: false })
    gameId: string;

    @Prop({ type: Object, required: false })
    metadata: Record<string, any>;

    @Prop({ required: false })
    duration: number; // in seconds, for session tracking

    @Prop({ default: Date.now })
    timestamp: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

// Indexes for analytics queries
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ timestamp: -1 });
