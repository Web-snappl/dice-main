// src/admin/controllers/analytics.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../modules/auth/auth.mongoSchema';
import { GameHistoryModel } from '../../common/gameHistory.mongoSchema';
import { Deposit } from '../../common/deposits.mongoSchema';
import { AnalyticsEvent } from '../schemas/analytics-event.schema';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

/**
 * Analytics Controller - Basic metrics only
 * Per requirements: Basic analytics, mark as "requires event tracking" where needed
 */
@Controller('admin/analytics')
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles('admin', 'moderator')
export class AnalyticsController {
    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
        @InjectModel(GameHistoryModel.name) private readonly gameHistoryModel: Model<GameHistoryModel>,
        @InjectModel(Deposit.name) private readonly depositModel: Model<Deposit>,
        @InjectModel(AnalyticsEvent.name) private readonly analyticsEventModel: Model<AnalyticsEvent>,
    ) { }

    @Get('dashboard')
    async getDashboard() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        try {
            const [
                totalUsers,
                newUsersToday,
                newUsersWeek,
                totalGamesPlayed,
                gamesToday,
                gamesWeek,
            ] = await Promise.all([
                this.userModel.countDocuments(),
                this.userModel.countDocuments({ createdAt: { $gte: dayAgo } }),
                this.userModel.countDocuments({ createdAt: { $gte: weekAgo } }),
                this.gameHistoryModel.countDocuments(),
                this.gameHistoryModel.countDocuments({ createdAt: { $gte: dayAgo } }),
                this.gameHistoryModel.countDocuments({ createdAt: { $gte: weekAgo } }),
            ]);

            // Active users estimation (users who played in last 24h)
            const activeUsersToday = await this.gameHistoryModel.distinct('uid', {
                createdAt: { $gte: dayAgo },
            });

            const activeUsersWeek = await this.gameHistoryModel.distinct('uid', {
                createdAt: { $gte: weekAgo },
            });

            return {
                users: {
                    total: totalUsers,
                    newToday: newUsersToday,
                    newThisWeek: newUsersWeek,
                    activeToday: activeUsersToday.length,
                    activeThisWeek: activeUsersWeek.length,
                },
                games: {
                    totalPlayed: totalGamesPlayed,
                    playedToday: gamesToday,
                    playedThisWeek: gamesWeek,
                },
                // Note: Some metrics require event tracking
                notes: {
                    averagePlaytime: 'Requires event tracking - not available',
                    sessionData: 'Requires event tracking - not available',
                },
            };
        } catch (error) {
            return {
                error: 'Failed to fetch analytics',
                users: { total: 0, newToday: 0, newThisWeek: 0, activeToday: 0, activeThisWeek: 0 },
                games: { totalPlayed: 0, playedToday: 0, playedThisWeek: 0 },
            };
        }
    }

    @Get('popular-games')
    async getPopularGames() {
        try {
            // Since we don't have a game type field in history, we'll show winner stats
            const pipeline = [
                {
                    $group: {
                        _id: '$uid',
                        displayName: { $first: '$displayName' },
                        gamesPlayed: { $sum: 1 },
                        wins: { $sum: { $cond: ['$winner', 1, 0] } },
                    },
                },
                { $sort: { gamesPlayed: -1 as const } },
                { $limit: 10 },
            ];

            const topPlayers = await this.gameHistoryModel.aggregate(pipeline).exec();

            return {
                topPlayers: topPlayers.map((p, index) => ({
                    rank: index + 1,
                    userId: p._id,
                    displayName: p.displayName,
                    gamesPlayed: p.gamesPlayed,
                    wins: p.wins,
                })),
                note: 'Game mode breakdown requires game type tracking in history model',
            };
        } catch (error) {
            return {
                error: 'Failed to fetch popular games data',
                topPlayers: [],
            };
        }
    }

    @Get('retention')
    async getRetention() {
        // Basic retention calculation
        // D1: Users who played on day 2 after registration
        // D7: Users who played on day 7 after registration

        try {
            const eventCount = await this.analyticsEventModel.countDocuments();

            if (eventCount === 0) {
                return {
                    message: 'Requires event tracking - retention data not available',
                    note: 'To enable retention tracking, implement session_start events in AnalyticsEvent model',
                    d1: null,
                    d7: null,
                    d30: null,
                };
            }

            // If events exist, calculate basic retention
            // This is a placeholder for more sophisticated tracking
            return {
                message: 'Basic retention estimation',
                note: 'For accurate retention, implement daily cohort tracking',
                d1: 'Event tracking required',
                d7: 'Event tracking required',
                d30: 'Event tracking required',
            };
        } catch (error) {
            return {
                message: 'Requires event tracking - retention data not available',
                d1: null,
                d7: null,
                d30: null,
            };
        }
    }

    @Get('revenue')
    async getRevenue() {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        try {
            const [totalDeposits, depositsThisMonth, revenueByDay] = await Promise.all([
                this.depositModel.aggregate([
                    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                ]),
                this.depositModel.aggregate([
                    { $match: { timestamp: { $gte: monthAgo } } },
                    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                ]),
                this.depositModel.aggregate([
                    { $match: { timestamp: { $gte: monthAgo } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                            total: { $sum: '$amount' },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ]),
            ]);

            return {
                allTime: {
                    totalAmount: totalDeposits[0]?.total || 0,
                    transactionCount: totalDeposits[0]?.count || 0,
                },
                last30Days: {
                    totalAmount: depositsThisMonth[0]?.total || 0,
                    transactionCount: depositsThisMonth[0]?.count || 0,
                },
                dailyBreakdown: revenueByDay.map(d => ({
                    date: d._id,
                    amount: d.total,
                    count: d.count,
                })),
                note: 'Read-only view. No payment integrations activated.',
            };
        } catch (error) {
            return {
                error: 'Failed to fetch revenue data',
                allTime: { totalAmount: 0, transactionCount: 0 },
                last30Days: { totalAmount: 0, transactionCount: 0 },
                dailyBreakdown: [],
            };
        }
    }
}
