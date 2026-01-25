// src/admin/controllers/financial.controller.ts
import { Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deposit } from '../../common/deposits.mongoSchema';
import { Reward } from '../schemas/reward.schema';
import { JwtAdminGuard } from '../guards/jwt-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class FinancialQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 20;
}

/**
 * Financial Controller - READ-ONLY views only
 * Per requirements: No payment provider integrations, no checkout, no Mobile Money activation
 * Returns placeholder responses where data is not tracked
 */
@Controller('admin/financial')
@UseGuards(JwtAdminGuard, RolesGuard)
@Roles('admin')
export class FinancialController {
    constructor(
        @InjectModel(Deposit.name) private readonly depositModel: Model<Deposit>,
        @InjectModel(Reward.name) private readonly rewardModel: Model<Reward>,
    ) { }

    @Get('transactions')
    async getTransactions(@Query(ValidationPipe) query: FinancialQueryDto) {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        try {
            const [transactions, total] = await Promise.all([
                this.depositModel
                    .find()
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.depositModel.countDocuments(),
            ]);

            return {
                transactions: transactions.map(t => ({
                    id: t._id.toString(),
                    userId: t.uid,
                    userName: t.displayName,
                    amount: t.amount,
                    type: 'deposit',
                    vip: t.vip,
                    timestamp: t.timestamp,
                })),
                total,
                page,
                limit,
            };
        } catch (error) {
            return {
                message: 'Not available: transaction data not fully tracked yet',
                transactions: [],
                total: 0,
                page,
                limit,
            };
        }
    }

    @Get('ledger')
    async getLedger(@Query(ValidationPipe) query: FinancialQueryDto) {
        // Virtual currency ledger - not currently tracked in this app
        return {
            message: 'Not available: virtual currency ledger not tracked yet',
            entries: [],
            total: 0,
            page: query.page || 1,
            limit: query.limit || 20,
        };
    }

    @Get('rewards-history')
    async getRewardsHistory(@Query(ValidationPipe) query: FinancialQueryDto) {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        try {
            const [rewards, total] = await Promise.all([
                this.rewardModel
                    .find()
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.rewardModel.countDocuments(),
            ]);

            return {
                rewards: rewards.map(r => ({
                    id: r._id.toString(),
                    userId: r.userId,
                    userName: r.userName,
                    type: r.type,
                    description: r.description,
                    value: r.value,
                    status: r.status,
                    allocatedBy: r.allocatedByName,
                    createdAt: r.createdAt,
                })),
                total,
                page,
                limit,
            };
        } catch (error) {
            return {
                message: 'Not available: rewards data not fully tracked yet',
                rewards: [],
                total: 0,
                page,
                limit,
            };
        }
    }

    @Get('anomalies')
    async getAnomalies() {
        // Basic anomaly detection on deposits
        try {
            // Flag unusual deposit patterns
            const pipeline = [
                {
                    $group: {
                        _id: '$uid',
                        displayName: { $first: '$displayName' },
                        totalDeposits: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                        avgAmount: { $avg: '$amount' },
                    },
                },
                {
                    $match: {
                        $or: [
                            { totalDeposits: { $gt: 20 } }, // More than 20 deposits
                            { totalAmount: { $gt: 10000 } }, // Total > 10000
                        ],
                    },
                },
                { $sort: { totalAmount: -1 as const } },
                { $limit: 20 },
            ];

            const anomalies = await this.depositModel.aggregate(pipeline).exec();

            return {
                anomalies: anomalies.map(a => ({
                    userId: a._id,
                    userName: a.displayName,
                    totalDeposits: a.totalDeposits,
                    totalAmount: a.totalAmount,
                    avgAmount: Math.round(a.avgAmount * 100) / 100,
                    flagReason: a.totalAmount > 10000
                        ? 'High total deposit amount'
                        : 'High deposit frequency',
                })),
                message: 'Basic anomaly detection based on deposit patterns',
            };
        } catch (error) {
            return {
                message: 'Not available: insufficient data for anomaly detection',
                anomalies: [],
            };
        }
    }

    @Get('summary')
    async getSummary() {
        try {
            const [totalDeposits, totalDepositAmount, totalRewards, rewardsByStatus] = await Promise.all([
                this.depositModel.countDocuments(),
                this.depositModel.aggregate([
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]),
                this.rewardModel.countDocuments(),
                this.rewardModel.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
            ]);

            const rewardsBreakdown = rewardsByStatus.reduce((acc: any, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {});

            return {
                deposits: {
                    count: totalDeposits,
                    totalAmount: totalDepositAmount[0]?.total || 0,
                },
                rewards: {
                    count: totalRewards,
                    breakdown: rewardsBreakdown,
                },
                message: 'Read-only financial summary. Payment integrations not activated.',
            };
        } catch (error) {
            return {
                message: 'Not available: financial data not fully tracked yet',
                deposits: { count: 0, totalAmount: 0 },
                rewards: { count: 0, breakdown: {} },
            };
        }
    }
}
