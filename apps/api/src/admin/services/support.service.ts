import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupportTicket, SupportTicketDocument, TicketMessage } from '../schemas/communication.mongo';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class SupportService {
    constructor(
        @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
        private readonly auditLogService: AuditLogService,
    ) { }

    async getTickets(query: any = {}) {
        const { status, category, assignedTo, page = 1, limit = 20 } = query;
        const filter: any = {};

        if (status) filter.status = status;
        if (category) filter.category = category;
        if (assignedTo === 'me') {
            // Logic handled in controller to inject admin ID
        } else if (assignedTo) {
            filter.assignedTo = assignedTo;
        }

        const total = await this.ticketModel.countDocuments(filter);
        const items = await this.ticketModel
            .find(filter)
            .sort({ updatedAt: -1 }) // Most recent updates first
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

    async getTicketStats() {
        const total = await this.ticketModel.countDocuments();
        const open = await this.ticketModel.countDocuments({ status: 'open' });
        const critical = await this.ticketModel.countDocuments({ priority: 'critical', status: { $ne: 'resolved' } });

        // Group by category
        const byCategory = await this.ticketModel.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        return { total, open, critical, byCategory };
    }

    async getTicket(id: string) {
        const ticket = await this.ticketModel.findById(id);
        if (!ticket) throw new NotFoundException('Ticket not found');
        return ticket;
    }

    // Admin reply
    async replyToTicket(id: string, message: string, adminId: string, request: any) {
        const ticket = await this.ticketModel.findById(id);
        if (!ticket) throw new NotFoundException('Ticket not found');

        const newMessage: TicketMessage = {
            senderId: adminId,
            senderType: 'admin',
            message,
            attachments: [],
            createdAt: new Date(),
        };

        ticket.messages.push(newMessage);

        // Auto-update status if it was open
        if (ticket.status === 'open') {
            ticket.status = 'waiting_user';
        }

        await ticket.save();

        await this.auditLogService.log({
            adminId,
            adminEmail: 'system',
            action: 'REPLY_TICKET',
            entityType: 'SUPPORT',
            entityId: id,
            description: 'Admin replied to ticket',
            request,
        });

        // TODO: Send push notification to user about reply

        return ticket;
    }

    async updateStatus(id: string, status: string, adminId: string, request: any) {
        const ticket = await this.ticketModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        if (!ticket) throw new NotFoundException('Ticket not found');

        await this.auditLogService.log({
            adminId,
            adminEmail: 'system',
            action: 'UPDATE_TICKET_STATUS',
            entityType: 'SUPPORT',
            entityId: id,
            description: `Updated ticket status to ${status}`,
            request,
        });

        return ticket;
    }

    async assignTicket(id: string, assignToId: string, adminId: string, request: any) {
        const ticket = await this.ticketModel.findByIdAndUpdate(
            id,
            { assignedTo: assignToId },
            { new: true }
        );
        if (!ticket) throw new NotFoundException('Ticket not found');

        return ticket;
    }

    // Temporary: Create basic ticket for testing since user app isn't connected
    async createMockTicket(data: any) {
        return this.ticketModel.create({
            ...data,
            messages: [{
                senderId: data.userId,
                senderType: 'user',
                message: data.initialMessage,
                createdAt: new Date()
            }]
        });
    }
}
