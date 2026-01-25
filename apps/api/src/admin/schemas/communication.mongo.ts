import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true })
export class Announcement {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ required: true, enum: ['info', 'warning', 'maintenance', 'update'], default: 'info' })
    type: string;

    @Prop({ required: true, enum: ['all', 'user', 'android', 'ios'], default: 'all' })
    target: string;

    @Prop({ required: false })
    targetUserId?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ required: false })
    expiresAt?: Date;

    @Prop({ required: true })
    createdBy: string;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

// --- Support Ticket Schemas ---

export type SupportTicketDocument = SupportTicket & Document;

@Schema()
export class TicketMessage {
    @Prop({ required: true })
    senderId: string;

    @Prop({ required: true, enum: ['user', 'admin', 'system'] })
    senderType: string;

    @Prop({ required: true })
    message: string;

    @Prop({ type: [String], default: [] })
    attachments: string[];

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ required: false })
    readAt?: Date;
}

const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);

@Schema({ timestamps: true })
export class SupportTicket {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: false })
    userEmail: string;

    @Prop({ required: true })
    subject: string;

    @Prop({ required: true, enum: ['account', 'technical', 'billing', 'report', 'other'] })
    category: string;

    @Prop({ required: true, enum: ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'], default: 'open', index: true })
    status: string;

    @Prop({ required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
    priority: string;

    @Prop({ type: [TicketMessageSchema], default: [] })
    messages: TicketMessage[];

    @Prop({ required: false, index: true })
    assignedTo?: string;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
