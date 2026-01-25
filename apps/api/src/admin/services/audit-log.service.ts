// src/admin/services/audit-log.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditAction, EntityType } from '../schemas/audit-log.schema';
import { Request } from 'express';

export interface AuditLogParams {
    adminId: string;
    adminEmail: string;
    action: AuditAction;
    entityType: EntityType;
    entityId?: string;
    beforeSnapshot?: Record<string, any>;
    afterSnapshot?: Record<string, any>;
    description?: string;
    request?: Request;
}

export interface AuditLogQuery {
    page?: number;
    limit?: number;
    adminId?: string;
    entityType?: EntityType;
    entityId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
}

@Injectable()
export class AuditLogService {
    constructor(
        @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
    ) { }

    async log(params: AuditLogParams): Promise<AuditLog> {
        const {
            adminId,
            adminEmail,
            action,
            entityType,
            entityId,
            beforeSnapshot,
            afterSnapshot,
            description,
            request,
        } = params;

        const logEntry = new this.auditLogModel({
            adminId,
            adminEmail,
            action,
            entityType,
            entityId,
            beforeSnapshot: this.sanitizeSnapshot(beforeSnapshot),
            afterSnapshot: this.sanitizeSnapshot(afterSnapshot),
            description,
            ipAddress: request ? this.getClientIp(request) : undefined,
            userAgent: request?.headers?.['user-agent'],
            timestamp: new Date(),
        });

        return logEntry.save();
    }

    async findAll(query: AuditLogQuery): Promise<{ logs: AuditLog[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, adminId, entityType, entityId, action, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (adminId) filter.adminId = adminId;
        if (entityType) filter.entityType = entityType;
        if (entityId) filter.entityId = entityId;
        if (action) filter.action = action;
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = startDate;
            if (endDate) filter.timestamp.$lte = endDate;
        }

        const [logs, total] = await Promise.all([
            this.auditLogModel
                .find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.auditLogModel.countDocuments(filter),
        ]);

        return { logs, total, page, limit };
    }

    async findById(id: string): Promise<AuditLog | null> {
        return this.auditLogModel.findById(id).exec();
    }

    async findByEntity(entityType: EntityType, entityId: string): Promise<AuditLog[]> {
        return this.auditLogModel
            .find({ entityType, entityId })
            .sort({ timestamp: -1 })
            .limit(100)
            .exec();
    }

    private sanitizeSnapshot(snapshot?: Record<string, any>): Record<string, any> | undefined {
        if (!snapshot) return undefined;

        const sanitized = { ...snapshot };

        // Remove sensitive fields from snapshots
        const sensitiveFields = ['password', 'adminPasswordHash', 'stripeAccountId'];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }

        return sanitized;
    }

    private getClientIp(request: Request): string {
        const forwarded = request.headers['x-forwarded-for'];
        if (forwarded) {
            const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
            return ips.trim();
        }
        return request.ip || request.socket?.remoteAddress || 'unknown';
    }
}
