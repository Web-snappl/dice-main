// src/admin/services/users.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHmac } from 'node:crypto';
import { User } from '../../modules/auth/auth.mongoSchema';
import { GameHistoryModel } from '../../common/gameHistory.mongoSchema';
import { CreateUserDto, UpdateUserDto, UsersQueryDto } from '../dto/users.dto';
import { AuditLogService } from './audit-log.service';
import { AdminUser } from '../decorators/current-admin.decorator';
import { Request } from 'express';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
        @InjectModel(GameHistoryModel.name) private readonly gameHistoryModel: Model<GameHistoryModel>,
        private readonly auditLogService: AuditLogService,
    ) { }

    async findAll(query: UsersQueryDto): Promise<{ users: any[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 20, search, role, status } = query;
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
            ];
        }

        if (role) {
            // Handle case variations
            filter.role = { $in: [role, role.charAt(0).toUpperCase() + role.slice(1)] };
        }

        if (status) {
            filter.status = status;
        }

        console.log('UsersService.findAll filter:', JSON.stringify(filter));


        const [users, total] = await Promise.all([
            this.userModel
                .find(filter)
                .select('-password -adminPasswordHash +balance')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.userModel.countDocuments(filter),
        ]);

        return {
            users: users.map(u => this.formatUser(u)),
            total,
            page,
            limit,
        };
    }

    async findById(id: string): Promise<any> {
        const user = await this.userModel.findById(id).select('-password -adminPasswordHash').exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.formatUser(user);
    }

    async findByIdWithHistory(id: string): Promise<any> {
        const user = await this.findById(id);

        // Get game history
        const gameHistory = await this.gameHistoryModel
            .find({ uid: id })
            .sort({ createdAt: -1 })
            .limit(50)
            .exec();

        return {
            ...user,
            gameHistory,
        };
    }

    async create(dto: CreateUserDto, admin: AdminUser, request: Request): Promise<any> {
        // Check if phone number already exists
        const existingUser = await this.userModel.findOne({ phoneNumber: dto.phoneNumber }).exec();
        if (existingUser) {
            throw new BadRequestException('User with this phone number already exists');
        }

        // Encrypt password using existing method (SHA256) for player auth compatibility
        const encryptedPassword = createHmac('sha256', process.env.CRYPTOGRAPHY_SECRET || '')
            .update(dto.password)
            .digest('hex');

        const newUser = new this.userModel({
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email?.toLowerCase(),
            phoneNumber: dto.phoneNumber,
            password: encryptedPassword,
            role: dto.role || 'user',
            status: 'active',
        });

        const savedUser = await newUser.save();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'CREATE_USER',
            entityType: 'USER',
            entityId: savedUser._id.toString(),
            afterSnapshot: this.formatUser(savedUser),
            description: `Created user: ${savedUser.firstName} ${savedUser.lastName}`,
            request,
        });

        return this.formatUser(savedUser);
    }

    async update(id: string, dto: UpdateUserDto, admin: AdminUser, request: Request): Promise<any> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const beforeSnapshot = this.formatUser(user);

        // Prepare update
        const updateData: any = {};
        if (dto.firstName) updateData.firstName = dto.firstName;
        if (dto.lastName) updateData.lastName = dto.lastName;
        if (dto.email) updateData.email = dto.email.toLowerCase();
        if (dto.phoneNumber) updateData.phoneNumber = dto.phoneNumber;
        if (dto.role) updateData.role = dto.role;
        if (dto.status) updateData.status = dto.status;
        if (typeof dto.balance === 'number') updateData.balance = dto.balance;

        console.log(`[DEBUG] Updating user ${id} balance. DTO balance: ${dto.balance}, updateData:`, updateData);

        const updatedUser = await this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
        console.log(`[DEBUG] Updated user from DB:`, updatedUser);

        // Log role change separately if applicable
        if (dto.role && dto.role !== user.role) {
            await this.auditLogService.log({
                adminId: admin.userId,
                adminEmail: admin.email,
                action: 'CHANGE_ROLE',
                entityType: 'USER',
                entityId: id,
                beforeSnapshot: { role: user.role },
                afterSnapshot: { role: dto.role },
                description: `Changed role from ${user.role} to ${dto.role}`,
                request,
            });
        }

        // Log balance change if applicable
        if (typeof dto.balance === 'number' && dto.balance !== user.balance) {
            await this.auditLogService.log({
                adminId: admin.userId,
                adminEmail: admin.email,
                action: 'UPDATE_BALANCE',
                entityType: 'USER',
                entityId: id,
                beforeSnapshot: { balance: user.balance },
                afterSnapshot: { balance: dto.balance },
                description: `Changed balance from ${user.balance ?? 0} to ${dto.balance}`,
                request,
            });
        }

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'UPDATE_USER',
            entityType: 'USER',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: this.formatUser(updatedUser),
            description: `Updated user: ${updatedUser.firstName} ${updatedUser.lastName}`,
            request,
        });

        return this.formatUser(updatedUser);
    }

    async delete(id: string, admin: AdminUser, request: Request): Promise<void> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const beforeSnapshot = this.formatUser(user);

        await this.userModel.findByIdAndDelete(id).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'DELETE_USER',
            entityType: 'USER',
            entityId: id,
            beforeSnapshot,
            description: `Deleted user: ${user.firstName} ${user.lastName}`,
            request,
        });
    }

    async suspend(id: string, reason: string, admin: AdminUser, request: Request): Promise<any> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const beforeSnapshot = this.formatUser(user);

        const updatedUser = await this.userModel.findByIdAndUpdate(
            id,
            {
                status: 'suspended',
                suspendedAt: new Date(),
                suspendedReason: reason,
            },
            { new: true },
        ).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'SUSPEND_USER',
            entityType: 'USER',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: this.formatUser(updatedUser),
            description: `Suspended user: ${user.firstName} ${user.lastName}. Reason: ${reason}`,
            request,
        });

        return this.formatUser(updatedUser);
    }

    async ban(id: string, reason: string, admin: AdminUser, request: Request): Promise<any> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const beforeSnapshot = this.formatUser(user);

        const updatedUser = await this.userModel.findByIdAndUpdate(
            id,
            {
                status: 'banned',
                bannedAt: new Date(),
                bannedReason: reason,
            },
            { new: true },
        ).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'BAN_USER',
            entityType: 'USER',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: this.formatUser(updatedUser),
            description: `Banned user: ${user.firstName} ${user.lastName}. Reason: ${reason}`,
            request,
        });

        return this.formatUser(updatedUser);
    }

    async restore(id: string, admin: AdminUser, request: Request): Promise<any> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const beforeSnapshot = this.formatUser(user);

        const updatedUser = await this.userModel.findByIdAndUpdate(
            id,
            {
                status: 'active',
                suspendedAt: null,
                suspendedReason: null,
                bannedAt: null,
                bannedReason: null,
            },
            { new: true },
        ).exec();

        await this.auditLogService.log({
            adminId: admin.userId,
            adminEmail: admin.email,
            action: 'RESTORE_USER',
            entityType: 'USER',
            entityId: id,
            beforeSnapshot,
            afterSnapshot: this.formatUser(updatedUser),
            description: `Restored user: ${user.firstName} ${user.lastName}`,
            request,
        });

        return this.formatUser(updatedUser);
    }

    private formatUser(user: any): any {
        return {
            id: user._id?.toString() || user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            status: user.status || 'active',
            balance: user.balance,
            photoURL: user.photoURL,
            isStripeConnected: user.isStripeConnected,
            suspendedAt: user.suspendedAt,
            suspendedReason: user.suspendedReason,
            bannedAt: user.bannedAt,
            bannedReason: user.bannedReason,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
        };
    }
}
