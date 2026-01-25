// src/admin/services/games.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameConfig } from '../schemas/game-config.schema';
import { CreateGameConfigDto, UpdateGameConfigDto, GamesQueryDto } from '../dto/games.dto';
import { AuditLogService } from './audit-log.service';
import { AdminUser } from '../decorators/current-admin.decorator';
import { Request } from 'express';

@Injectable()
export class GamesService {
    constructor(
        @InjectModel(GameConfig.name) private readonly gameConfigModel: Model<GameConfig>,
        private readonly auditLogService: AuditLogService,
    ) { }

    async findAll(query: GamesQueryDto): Promise<{ games: GameConfig[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, search, isActive } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        if (isActive !== undefined) {
            filter.isActive = isActive;
        }

        const [games, total] = await Promise.all([
            this.gameConfigModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.gameConfigModel.countDocuments(filter),
        ]);

        return { games, total, page, limit };
    }

    async findById(id: string): Promise<GameConfig> {
        const game = await this.gameConfigModel.findById(id).exec();
        if (!game) {
            throw new NotFoundException('Game config not found');
        }
        return game;
    }

    async create(dto: CreateGameConfigDto, admin: AdminUser, request: Request): Promise<GameConfig> {
        // Check for duplicate name
        const existing = await this.gameConfigModel.findOne({ name: dto.name }).exec();
        if (existing) {
            throw new BadRequestException('Game with this name already exists');
        }

        const newGame = new this.gameConfigModel({
            ...dto,
            createdBy: admin.userId,
        });

        const savedGame = await newGame.save();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'CREATE_GAME',
            entityType: 'GAME',
            entityId: savedGame._id.toString(),
            afterSnapshot: savedGame.toObject(),
            description: `Created game: ${savedGame.name}`,
            request,
        });

        return savedGame;
    }

    async update(id: string, dto: UpdateGameConfigDto, admin: AdminUser, request: Request): Promise<GameConfig> {
        const game = await this.gameConfigModel.findById(id).exec();
        if (!game) {
            throw new NotFoundException('Game config not found');
        }

        const beforeSnapshot = game.toObject();

        const updateData: any = { ...dto, updatedAt: new Date() };

        const updatedGame = await this.gameConfigModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'UPDATE_GAME',
            entityType: 'GAME',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: updatedGame.toObject(),
            description: `Updated game: ${updatedGame.name}`,
            request,
        });

        return updatedGame;
    }

    async delete(id: string, admin: AdminUser, request: Request): Promise<void> {
        const game = await this.gameConfigModel.findById(id).exec();
        if (!game) {
            throw new NotFoundException('Game config not found');
        }

        const beforeSnapshot = game.toObject();

        await this.gameConfigModel.findByIdAndDelete(id).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'DELETE_GAME',
            entityType: 'GAME',
            entityId: id,
            beforeSnapshot,
            description: `Deleted game: ${game.name}`,
            request,
        });
    }

    async activate(id: string, admin: AdminUser, request: Request): Promise<GameConfig> {
        const game = await this.gameConfigModel.findById(id).exec();
        if (!game) {
            throw new NotFoundException('Game config not found');
        }

        const beforeSnapshot = game.toObject();

        const updatedGame = await this.gameConfigModel.findByIdAndUpdate(
            id,
            { isActive: true, updatedAt: new Date() },
            { new: true }
        ).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'ACTIVATE_GAME',
            entityType: 'GAME',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: updatedGame.toObject(),
            description: `Activated game: ${game.name}`,
            request,
        });

        return updatedGame;
    }

    async deactivate(id: string, admin: AdminUser, request: Request): Promise<GameConfig> {
        const game = await this.gameConfigModel.findById(id).exec();
        if (!game) {
            throw new NotFoundException('Game config not found');
        }

        const beforeSnapshot = game.toObject();

        const updatedGame = await this.gameConfigModel.findByIdAndUpdate(
            id,
            { isActive: false, updatedAt: new Date() },
            { new: true }
        ).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'DEACTIVATE_GAME',
            entityType: 'GAME',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: updatedGame.toObject(),
            description: `Deactivated game: ${game.name}`,
            request,
        });

        return updatedGame;
    }
}
