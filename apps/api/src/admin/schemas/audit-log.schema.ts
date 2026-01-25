// src/admin/schemas/audit-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditAction =
    | 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER'
    | 'SUSPEND_USER' | 'BAN_USER' | 'RESTORE_USER'
    | 'CHANGE_ROLE'
    | 'CREATE_GAME' | 'UPDATE_GAME' | 'DELETE_GAME'
    | 'ACTIVATE_GAME' | 'DEACTIVATE_GAME'
    | 'RESET_SCORE'
    | 'CREATE_TOURNAMENT' | 'UPDATE_TOURNAMENT' | 'DELETE_TOURNAMENT'
    | 'ALLOCATE_REWARD'
    | 'UPDATE_REPORT' | 'RESOLVE_REPORT'
    | 'MODERATE_CONTENT' | 'HIDE_CONTENT' | 'DELETE_CONTENT'
    | 'UPDATE_CONFIG'
    | 'CREATE_ANNOUNCEMENT' | 'UPDATE_ANNOUNCEMENT' | 'DELETE_ANNOUNCEMENT' | 'SEND_NOTIFICATION'
    | 'REPLY_TICKET' | 'UPDATE_TICKET_STATUS'
    | 'ADMIN_LOGIN' | 'ADMIN_LOGOUT';

export type EntityType =
    | 'USER' | 'GAME' | 'TOURNAMENT' | 'SCORE'
    | 'REWARD' | 'REPORT' | 'CONTENT' | 'CONFIG' | 'AUTH' | 'COMMUNICATION' | 'SUPPORT';

@Schema({ timestamps: true })
export class AuditLog extends Document {
    @Prop({ required: true })
    adminId: string;

    @Prop({ required: true })
    adminEmail: string;

    @Prop({ required: true })
    action: AuditAction;

    @Prop({ required: true })
    entityType: EntityType;

    @Prop({ required: false })
    entityId: string;

    @Prop({ type: Object, required: false })
    beforeSnapshot: Record<string, any>;

    @Prop({ type: Object, required: false })
    afterSnapshot: Record<string, any>;

    @Prop({ required: false })
    ipAddress: string;

    @Prop({ required: false })
    userAgent: string;

    @Prop({ required: false })
    description: string;

    @Prop({ default: Date.now })
    timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Add indexes for efficient querying
AuditLogSchema.index({ adminId: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });
