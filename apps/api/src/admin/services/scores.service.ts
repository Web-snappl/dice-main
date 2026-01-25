// src/admin/services/scores.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameHistoryModel } from '../../common/gameHistory.mongoSchema';
import { User } from '../../modules/auth/auth.mongoSchema';
import { ScoresQueryDto, RankingsQueryDto } from '../dto/scores.dto';
import { AuditLogService } from './audit-log.service';
import { AdminUser } from '../decorators/current-admin.decorator';
import { Request } from 'express';

export interface RankingEntry {
    rank: number;
    userId: string;
    displayName: string;
    totalWins: number;
    totalGames: number;
    winRate: number;
}

@Injectable()
export class ScoresService {
    constructor(
        @InjectModel(GameHistoryModel.name) private readonly gameHistoryModel: Model<GameHistoryModel>,
        @InjectModel('users') private readonly userModel: Model<User>,
        private readonly auditLogService: AuditLogService,
    ) { }

    async findAll(query: ScoresQueryDto): Promise<{ scores: any[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, userId } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (userId) filter.uid = userId;

        const [scores, total] = await Promise.all([
            this.gameHistoryModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.gameHistoryModel.countDocuments(filter),
        ]);

        return { scores, total, page, limit };
    }



    async getRankings(query: RankingsQueryDto): Promise<RankingEntry[]> {
        const { period = 'global', limit = 100 } = query;

        // Calculate date filter based on period
        const dateFilter: any = {};
        const now = new Date();

        if (period === 'weekly') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter.createdAt = { $gte: weekAgo };
        } else if (period === 'monthly') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter.createdAt = { $gte: monthAgo };
        }

        // Aggregate wins by user - use explicit type casting for Mongoose compatibility
        const results = await this.gameHistoryModel.aggregate([
            { $match: { ...dateFilter } },
            {
                $group: {
                    _id: '$uid',
                    displayName: { $first: '$displayName' },
                    totalWins: { $sum: { $cond: ['$winner', 1, 0] } },
                    totalGames: { $sum: 1 },
                },
            },
            {
                $project: {
                    userId: '$_id',
                    displayName: 1,
                    totalWins: 1,
                    totalGames: 1,
                    winRate: {
                        $cond: [
                            { $eq: ['$totalGames', 0] },
                            0,
                            { $multiply: [{ $divide: ['$totalWins', '$totalGames'] }, 100] },
                        ],
                    },
                },
            },
            { $sort: { totalWins: -1 as const, winRate: -1 as const } },
            { $limit: limit },
        ]).exec();

        return results.map((r: any, index: number) => ({
            rank: index + 1,
            userId: r.userId,
            displayName: r.displayName || 'Unknown',
            totalWins: r.totalWins,
            totalGames: r.totalGames,
            winRate: Math.round(r.winRate * 100) / 100,
        }));
    }

    async getSuspiciousScores(): Promise<any[]> {
        // Strategy 1: Explicit flags from GameService
        const flagged = await this.gameHistoryModel.find({ isFlagged: true }).sort({ createdAt: -1 }).limit(50).exec();
        const flaggedFormatted = flagged.map(f => ({
            userId: f.uid,
            displayName: f.displayName,
            totalWins: 0, // Placeholder
            totalGames: 0, // Placeholder
            winRate: 0, // Placeholder
            flagReason: f.flagReason || 'Flagged by system',
            flaggedAt: f.createdAt
        }));

        // Strategy 2: High win rates Aggregation
        const highWinRate = await this.gameHistoryModel.aggregate([
            {
                $group: {
                    _id: '$uid',
                    displayName: { $first: '$displayName' },
                    totalWins: { $sum: { $cond: ['$winner', 1, 0] } },
                    totalGames: { $sum: 1 },
                },
            },
            {
                $project: {
                    userId: '$_id',
                    displayName: 1,
                    totalWins: 1,
                    totalGames: 1,
                    winRate: {
                        $cond: [
                            { $eq: ['$totalGames', 0] },
                            0,
                            { $multiply: [{ $divide: ['$totalWins', '$totalGames'] }, 100] },
                        ],
                    },
                },
            },
            {
                $match: {
                    totalGames: { $gte: 10 },
                    winRate: { $gt: 90 },
                },
            },
            { $sort: { winRate: -1 as const } },
        ]).exec();

        const highWinRateFormatted = highWinRate.map((r: any) => ({
            userId: r.userId,
            displayName: r.displayName || 'Unknown',
            totalWins: r.totalWins,
            totalGames: r.totalGames,
            winRate: Math.round(r.winRate * 100) / 100,
            flagReason: 'Win rate exceeds 90% threshold',
            flaggedAt: new Date(),
        }));

        // Merge lists (avoid duplicates if same user flagged by both)
        const combined = [...flaggedFormatted];
        for (const h of highWinRateFormatted) {
            if (!combined.find(c => c.userId === h.userId)) {
                combined.push(h);
            }
        }

        return combined;
    }

    async resetScores(userId: string, reason: string, admin: AdminUser, request: Request): Promise<{ deleted: number }> {
        // Get count before deletion for audit
        const gameHistories = await this.gameHistoryModel.find({ uid: userId }).exec();
        const beforeSnapshot = {
            count: gameHistories.length,
            sampleRecords: gameHistories.slice(0, 5).map(g => g.toObject()),
        };

        const result = await this.gameHistoryModel.deleteMany({ uid: userId }).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'RESET_SCORE',
            entityType: 'SCORE',
            entityId: userId,
            beforeSnapshot,
            afterSnapshot: { deleted: result.deletedCount },
            description: `Reset scores for user ${userId}. Reason: ${reason}. Deleted ${result.deletedCount} records.`,
            request,
        });

        return { deleted: result.deletedCount };
    }
}
