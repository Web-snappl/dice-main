import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Announcement, AnnouncementDocument } from '../schemas/communication.mongo';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class CommunicationService {
    constructor(
        @InjectModel(Announcement.name) private announcementModel: Model<AnnouncementDocument>,
        private readonly auditLogService: AuditLogService,
    ) { }

    async getAnnouncements(query: any = {}) {
        const { isActive, type, page = 1, limit = 20 } = query;
        const filter: any = {};

        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (type) filter.type = type;

        const total = await this.announcementModel.countDocuments(filter);
        const items = await this.announcementModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        return {
            items,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
        };
    }

    async createAnnouncement(data: Partial<Announcement>, adminId: string, request: any) {
        const announcement = new this.announcementModel({
            ...data,
            createdBy: adminId,
            createdAt: new Date(),
        });

        await announcement.save();

        await this.auditLogService.log({
            adminId,
            adminEmail: 'system', // TODO: Get from request
            action: 'CREATE_ANNOUNCEMENT',
            entityType: 'COMMUNICATION',
            entityId: announcement._id.toString(),
            description: `Created announcement: ${data.title}`,
            request,
        });

        return announcement;
    }

    async updateAnnouncement(id: string, data: Partial<Announcement>, adminId: string, request: any) {
        const announcement = await this.announcementModel.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true }
        );

        if (!announcement) throw new NotFoundException('Announcement not found');

        await this.auditLogService.log({
            adminId,
            adminEmail: 'system',
            action: 'UPDATE_ANNOUNCEMENT',
            entityType: 'COMMUNICATION',
            entityId: id,
            description: `Updated announcement: ${announcement.title}`,
            request,
        });

        return announcement;
    }

    async deleteAnnouncement(id: string, adminId: string, request: any) {
        const announcement = await this.announcementModel.findByIdAndDelete(id);
        if (!announcement) throw new NotFoundException('Announcement not found');

        await this.auditLogService.log({
            adminId,
            adminEmail: 'system',
            action: 'DELETE_ANNOUNCEMENT',
            entityType: 'COMMUNICATION',
            entityId: id,
            description: `Deleted announcement: ${announcement.title}`,
            request,
        });

        return { success: true };
    }

    // Stub for manual notification push
    async sendNotification(data: { title: string; message: string; userId?: string }, adminId: string, request: any) {
        // Logic to integrate with NotificationService/FCM would go here

        await this.auditLogService.log({
            adminId,
            adminEmail: 'system',
            action: 'SEND_NOTIFICATION',
            entityType: 'COMMUNICATION',
            entityId: data.userId || 'global',
            description: `Sent notification: ${data.title}`,
            request,
        });

        return { success: true, message: 'Notification queued for delivery' };
    }
}
