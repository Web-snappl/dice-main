// src/admin/schemas/report.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportStatus = 'open' | 'in_review' | 'resolved';
export type ReportReason =
    | 'cheating' | 'harassment' | 'inappropriate_content'
    | 'spam' | 'bug_exploit' | 'other';

@Schema({ timestamps: true })
export class Report extends Document {
    @Prop({ required: true })
    reporterId: string;

    @Prop({ required: false })
    reporterName: string;

    @Prop({ required: true })
    reportedUserId: string;

    @Prop({ required: false })
    reportedUserName: string;

    @Prop({ required: true, enum: ['cheating', 'harassment', 'inappropriate_content', 'spam', 'bug_exploit', 'other'] })
    reason: ReportReason;

    @Prop({ required: false })
    description: string;

    @Prop({ required: true, enum: ['open', 'in_review', 'resolved'], default: 'open' })
    status: ReportStatus;

    @Prop({ required: false })
    moderatorId: string;

    @Prop({ required: false })
    moderatorName: string;

    @Prop({ required: false })
    moderatorNotes: string;

    @Prop({ required: false })
    resolution: string;

    @Prop({ required: false })
    resolvedAt: Date;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Indexes
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reportedUserId: 1 });
ReportSchema.index({ reporterId: 1 });
