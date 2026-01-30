// src/admin/services/admin-auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../../modules/auth/auth.mongoSchema';
import { AuditLogService } from './audit-log.service';
import { Request } from 'express';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// In-memory rate limiting (for MVP; use Redis in production)
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export interface AdminTokenPayload {
    sub: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
}

export interface AdminLoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    };
}

@Injectable()
export class AdminAuthService {
    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
        private readonly configService: ConfigService,
        private readonly auditLogService: AuditLogService,
    ) { }

    async login(email: string, password: string, request: Request): Promise<AdminLoginResponse> {
        // Rate limiting check
        this.checkRateLimit(email);

        // Find user by email with admin or moderator role
        const user = await this.userModel.findOne({
            email: email.toLowerCase(),
            role: { $in: ['admin', 'Admin', 'moderator'] },
        }).exec();

        if (!user) {
            this.recordFailedAttempt(email);
            throw new UnauthorizedException('Invalid credentials or insufficient permissions');
        }

        // Check if user is banned or suspended
        if (user.status === 'banned') {
            throw new UnauthorizedException('Account is banned');
        }
        if (user.status === 'suspended') {
            throw new UnauthorizedException('Account is suspended');
        }

        // Verify password using bcrypt (adminPasswordHash field)
        if (!user.adminPasswordHash) {
            this.recordFailedAttempt(email);
            throw new UnauthorizedException('Admin password not set. Please contact support.');
        }

        const isPasswordValid = await bcrypt.compare(password, user.adminPasswordHash);
        if (!isPasswordValid) {
            this.recordFailedAttempt(email);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Clear rate limit on successful login
        loginAttempts.delete(email.toLowerCase());

        // Update last login info
        await this.userModel.findByIdAndUpdate(user._id, {
            lastLoginAt: new Date(),
            lastLoginIp: this.getClientIp(request),
        });

        // Generate tokens
        const tokens = this.generateTokens(user);

        // Audit log
        await this.auditLogService.log({
            adminId: user._id.toString(),
            adminEmail: user.email,
            action: 'ADMIN_LOGIN',
            entityType: 'AUTH',
            entityId: user._id.toString(),
            description: 'Admin login successful',
            request,
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        };
    }

    async logout(userId: string, email: string, request: Request): Promise<void> {
        await this.auditLogService.log({
            adminId: userId,
            adminEmail: email,
            action: 'ADMIN_LOGOUT',
            entityType: 'AUTH',
            entityId: userId,
            description: 'Admin logout',
            request,
        });
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const secret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'admin_refresh_secret_change_in_production';
            const payload = jwt.verify(refreshToken, secret) as AdminTokenPayload;

            if (!payload.isAdmin) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Check user still exists and has admin privileges
            const user = await this.userModel.findById(payload.sub).exec();
            if (!user || !['admin', 'Admin', 'moderator'].includes(user.role)) {
                throw new UnauthorizedException('User no longer has admin access');
            }

            if (user.status === 'banned' || user.status === 'suspended') {
                throw new UnauthorizedException('Account is not active');
            }

            const accessToken = this.generateAccessToken(user);
            return { accessToken };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException('Refresh token expired');
            }
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async getMe(userId: string): Promise<any> {
        const user = await this.userModel.findById(userId).select('-password -adminPasswordHash').exec();
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
        };
    }

    async setAdminPassword(userId: string, newPassword: string): Promise<void> {
        if (newPassword.length < 8) {
            throw new BadRequestException('Password must be at least 8 characters');
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await this.userModel.findByIdAndUpdate(userId, {
            adminPasswordHash: hashedPassword,
        });
    }

    async seedAdminAccount(): Promise<{ created: boolean; email: string }> {
        const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
        const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

        if (!adminEmail || !adminPassword) {
            console.log('⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin seed.');
            return { created: false, email: '' };
        }

        // Check if admin already exists
        let admin = await this.userModel.findOne({ email: adminEmail.toLowerCase() }).exec();

        if (admin) {
            // ALWAYS update admin password hash from env var to ensure access
            const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
            await this.userModel.findByIdAndUpdate(admin._id, {
                adminPasswordHash: hashedPassword,
                role: 'admin',
                status: 'active',
            });
            console.log(`✅ Updated/Reset admin password for: ${adminEmail}`);
            return { created: false, email: adminEmail };
        }

        // Create new admin account
        const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
        const newAdmin = new this.userModel({
            email: adminEmail.toLowerCase(),
            firstName: 'Admin',
            lastName: 'User',
            phoneNumber: '0000000000', // Placeholder
            password: 'not_used_for_admin', // Player auth field
            adminPasswordHash: hashedPassword,
            role: 'admin',
            status: 'active',
        });

        await newAdmin.save();
        console.log(`✅ Created admin account: ${adminEmail}`);
        return { created: true, email: adminEmail };
    }

    private generateTokens(user: User): { accessToken: string; refreshToken: string } {
        return {
            accessToken: this.generateAccessToken(user),
            refreshToken: this.generateRefreshToken(user),
        };
    }

    private generateAccessToken(user: User): string {
        const secret = this.configService.get<string>('JWT_SECRET') || 'admin_jwt_secret_change_in_production';
        const expiresIn = this.configService.get<string | number>('JWT_EXPIRES_IN') || '1h';

        const payload: AdminTokenPayload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: true,
        };

        return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
    }

    private generateRefreshToken(user: User): string {
        const secret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'admin_refresh_secret_change_in_production';
        const expiresIn = this.configService.get<string | number>('JWT_REFRESH_EXPIRES_IN') || '7d';

        const payload: AdminTokenPayload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: true,
        };

        return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
    }

    private checkRateLimit(email: string): void {
        const key = email.toLowerCase();
        const attempts = loginAttempts.get(key);

        if (attempts) {
            const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();

            if (attempts.count >= MAX_LOGIN_ATTEMPTS && timeSinceLastAttempt < LOCKOUT_DURATION_MS) {
                const remainingTime = Math.ceil((LOCKOUT_DURATION_MS - timeSinceLastAttempt) / 60000);
                throw new UnauthorizedException(`Too many failed attempts. Try again in ${remainingTime} minutes.`);
            }

            // Reset if lockout period has passed
            if (timeSinceLastAttempt >= LOCKOUT_DURATION_MS) {
                loginAttempts.delete(key);
            }
        }
    }

    private recordFailedAttempt(email: string): void {
        const key = email.toLowerCase();
        const attempts = loginAttempts.get(key);

        if (attempts) {
            attempts.count++;
            attempts.lastAttempt = new Date();
        } else {
            loginAttempts.set(key, { count: 1, lastAttempt: new Date() });
        }
    }

    private getClientIp(request: Request): string {
        const forwarded = request.headers['x-forwarded-for'];
        if (forwarded) {
            const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
            return ips.trim();
        }
        return request.ip || request.socket?.remoteAddress || 'unknown';
    }
}
