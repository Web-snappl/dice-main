// src/admin/services/reports.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from '../schemas/report.schema';
import { UpdateReportDto, ReportsQueryDto } from '../dto/reports.dto';
import { AuditLogService } from './audit-log.service';
import { AdminUser } from '../decorators/current-admin.decorator';
import { Request } from 'express';

@Injectable()
export class ReportsService {
    constructor(
        @InjectModel(Report.name) private readonly reportModel: Model<Report>,
        private readonly auditLogService: AuditLogService,
    ) { }

    async findAll(query: ReportsQueryDto): Promise<{ reports: Report[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, status, reportedUserId, reporterId } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (status) filter.status = status;
        if (reportedUserId) filter.reportedUserId = reportedUserId;
        if (reporterId) filter.reporterId = reporterId;

        const [reports, total] = await Promise.all([
            this.reportModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.reportModel.countDocuments(filter),
        ]);

        return { reports, total, page, limit };
    }

    async findById(id: string): Promise<Report> {
        const report = await this.reportModel.findById(id).exec();
        if (!report) {
            throw new NotFoundException('Report not found');
        }
        return report;
    }

    async update(id: string, dto: UpdateReportDto, admin: AdminUser, request: Request): Promise<Report> {
        const report = await this.reportModel.findById(id).exec();
        if (!report) {
            throw new NotFoundException('Report not found');
        }

        const beforeSnapshot = report.toObject();

        const updateData: any = {
            updatedAt: new Date(),
            moderatorId: admin.userId,
            moderatorName: `${admin.firstName} ${admin.lastName}`,
        };

        if (dto.status) {
            updateData.status = dto.status;
            if (dto.status === 'resolved') {
                updateData.resolvedAt = new Date();
            }
        }
        if (dto.moderatorNotes) updateData.moderatorNotes = dto.moderatorNotes;
        if (dto.resolution) updateData.resolution = dto.resolution;

        const updatedReport = await this.reportModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: dto.status === 'resolved' ? 'RESOLVE_REPORT' : 'UPDATE_REPORT',
            entityType: 'REPORT',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: updatedReport.toObject(),
            description: `Updated report status to ${dto.status || 'unchanged'}`,
            request,
        });

        return updatedReport;
    }

    async getStats(): Promise<{ open: number; inReview: number; resolved: number; total: number }> {
        const [open, inReview, resolved] = await Promise.all([
            this.reportModel.countDocuments({ status: 'open' }),
            this.reportModel.countDocuments({ status: 'in_review' }),
            this.reportModel.countDocuments({ status: 'resolved' }),
        ]);

        return {
            open,
            inReview,
            resolved,
            total: open + inReview + resolved,
        };
    }
}
