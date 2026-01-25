// src/admin/services/tournaments.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tournament } from '../schemas/tournament.schema';
import { CreateTournamentDto, UpdateTournamentDto, TournamentsQueryDto } from '../dto/tournaments.dto';
import { AuditLogService } from './audit-log.service';
import { AdminUser } from '../decorators/current-admin.decorator';
import { Request } from 'express';

@Injectable()
export class TournamentsService {
    constructor(
        @InjectModel(Tournament.name) private readonly tournamentModel: Model<Tournament>,
        private readonly auditLogService: AuditLogService,
    ) { }

    async findAll(query: TournamentsQueryDto): Promise<{ tournaments: Tournament[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, status, search } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const [tournaments, total] = await Promise.all([
            this.tournamentModel
                .find(filter)
                .sort({ startDate: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.tournamentModel.countDocuments(filter),
        ]);

        return { tournaments, total, page, limit };
    }

    async findById(id: string): Promise<Tournament> {
        const tournament = await this.tournamentModel.findById(id).exec();
        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }
        return tournament;
    }

    async create(dto: CreateTournamentDto, admin: AdminUser, request: Request): Promise<Tournament> {
        if (dto.startDate >= dto.endDate) {
            throw new BadRequestException('Start date must be before end date');
        }

        const newTournament = new this.tournamentModel({
            ...dto,
            status: 'draft',
            createdBy: admin.userId,
        });

        const savedTournament = await newTournament.save();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'CREATE_TOURNAMENT',
            entityType: 'TOURNAMENT',
            entityId: savedTournament._id.toString(),
            afterSnapshot: savedTournament.toObject(),
            description: `Created tournament: ${savedTournament.name}`,
            request,
        });

        return savedTournament;
    }

    async update(id: string, dto: UpdateTournamentDto, admin: AdminUser, request: Request): Promise<Tournament> {
        const tournament = await this.tournamentModel.findById(id).exec();
        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        // Validate status transitions
        if (dto.status) {
            const validTransitions: Record<string, string[]> = {
                draft: ['scheduled', 'cancelled'],
                scheduled: ['active', 'cancelled'],
                active: ['completed', 'cancelled'],
                completed: [],
                cancelled: [],
            };

            if (!validTransitions[tournament.status].includes(dto.status)) {
                throw new BadRequestException(
                    `Invalid status transition from ${tournament.status} to ${dto.status}`
                );
            }
        }

        const beforeSnapshot = tournament.toObject();

        const updateData: any = { ...dto, updatedAt: new Date() };

        const updatedTournament = await this.tournamentModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'UPDATE_TOURNAMENT',
            entityType: 'TOURNAMENT',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: updatedTournament.toObject(),
            description: `Updated tournament: ${updatedTournament.name}`,
            request,
        });

        return updatedTournament;
    }

    async delete(id: string, admin: AdminUser, request: Request): Promise<void> {
        const tournament = await this.tournamentModel.findById(id).exec();
        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        if (tournament.status === 'active') {
            throw new BadRequestException('Cannot delete an active tournament');
        }

        const beforeSnapshot = tournament.toObject();

        await this.tournamentModel.findByIdAndDelete(id).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'DELETE_TOURNAMENT',
            entityType: 'TOURNAMENT',
            entityId: id,
            beforeSnapshot,
            description: `Deleted tournament: ${tournament.name}`,
            request,
        });
    }

    async getUpcoming(): Promise<Tournament[]> {
        const now = new Date();
        return this.tournamentModel
            .find({
                status: { $in: ['scheduled', 'active'] },
                endDate: { $gte: now },
            })
            .sort({ startDate: 1 })
            .limit(10)
            .exec();
    }
}
