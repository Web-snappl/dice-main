// src/admin/services/rewards.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reward } from '../schemas/reward.schema';
import { CreateRewardDto, UpdateRewardDto, RewardsQueryDto } from '../dto/rewards.dto';
import { AuditLogService } from './audit-log.service';
import { AdminUser } from '../decorators/current-admin.decorator';
import { Request } from 'express';

@Injectable()
export class RewardsService {
    constructor(
        @InjectModel(Reward.name) private readonly rewardModel: Model<Reward>,
        private readonly auditLogService: AuditLogService,
    ) { }

    async findAll(query: RewardsQueryDto): Promise<{ rewards: Reward[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, userId, status, type } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (userId) filter.userId = userId;
        if (status) filter.status = status;
        if (type) filter.type = type;

        const [rewards, total] = await Promise.all([
            this.rewardModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.rewardModel.countDocuments(filter),
        ]);

        return { rewards, total, page, limit };
    }

    async findById(id: string): Promise<Reward> {
        const reward = await this.rewardModel.findById(id).exec();
        if (!reward) {
            throw new NotFoundException('Reward not found');
        }
        return reward;
    }

    async create(dto: CreateRewardDto, admin: AdminUser, request: Request): Promise<Reward> {
        const newReward = new this.rewardModel({
            ...dto,
            status: 'allocated',
            allocatedBy: admin.userId,
            allocatedByName: `${admin.firstName} ${admin.lastName}`,
        });

        const savedReward = await newReward.save();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'ALLOCATE_REWARD',
            entityType: 'REWARD',
            entityId: savedReward._id.toString(),
            afterSnapshot: savedReward.toObject(),
            description: `Allocated ${dto.type} reward to user ${dto.userId}: ${dto.description}`,
            request,
        });

        return savedReward;
    }

    async update(id: string, dto: UpdateRewardDto, admin: AdminUser, request: Request): Promise<Reward> {
        const reward = await this.rewardModel.findById(id).exec();
        if (!reward) {
            throw new NotFoundException('Reward not found');
        }

        const beforeSnapshot = reward.toObject();

        const updateData: any = {};
        if (dto.status) {
            updateData.status = dto.status;
            if (dto.status === 'claimed') {
                updateData.claimedAt = new Date();
            }
        }
        if (dto.notes) updateData.notes = dto.notes;

        const updatedReward = await this.rewardModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'ALLOCATE_REWARD',
            entityType: 'REWARD',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: updatedReward.toObject(),
            description: `Updated reward ${id}`,
            request,
        });

        return updatedReward;
    }

    async allocateToTopN(tournamentId: string, topN: number, rewardDescription: string, admin: AdminUser, request: Request): Promise<Reward[]> {
        // This is a simple auto-allocation for tournament winners
        // In a real implementation, this would query the tournament results
        // For MVP, this is a placeholder that can be enhanced

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'ALLOCATE_REWARD',
            entityType: 'REWARD',
            entityId: tournamentId,
            description: `Initiated auto-allocation for top ${topN} in tournament ${tournamentId}`,
            request,
        });

        // Return empty array - actual implementation would create rewards based on tournament results
        return [];
    }

    async getStats(): Promise<{ pending: number; allocated: number; claimed: number; expired: number; total: number }> {
        const [pending, allocated, claimed, expired] = await Promise.all([
            this.rewardModel.countDocuments({ status: 'pending' }),
            this.rewardModel.countDocuments({ status: 'allocated' }),
            this.rewardModel.countDocuments({ status: 'claimed' }),
            this.rewardModel.countDocuments({ status: 'expired' }),
        ]);

        return {
            pending,
            allocated,
            claimed,
            expired,
            total: pending + allocated + claimed + expired,
        };
    }
}
