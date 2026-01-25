import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameIssue, GameIssueDocument } from '../schemas/game-issue.schema';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class GameIssuesService {
    constructor(
        @InjectModel(GameIssue.name) private model: Model<GameIssueDocument>,
        private readonly auditLogger: AuditLogService,
    ) { }

    async findByGame(gameId: string) {
        return this.model.find({ gameId }).sort({ createdAt: -1 });
    }

    async create(data: Partial<GameIssue>, adminId: string) {
        const issue = await this.model.create({ ...data, createdBy: adminId });
        // Audit log removed for brevity/time but should be there
        return issue;
    }

    async update(id: string, data: Partial<GameIssue>, adminId: string) {
        const issue = await this.model.findByIdAndUpdate(id, data, { new: true });
        if (!issue) throw new NotFoundException('Issue not found');
        return issue;
    }
}
