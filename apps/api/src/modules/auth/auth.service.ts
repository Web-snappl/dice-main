import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { User, UserRole } from './auth.mongoSchema';
import { UserResponse } from './createUser.dto';
import { createHmac } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { PromoCodesService } from '../../admin/services/promo-codes.service';

const SALT_ROUNDS = 12;

export interface UserTokenPayload {
    sub: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}

export interface UserLoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        uid: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        role: string;
        balance: number;
        stripeAccountId?: string;
        isStripeConnected?: boolean;
    };
}

@Injectable()
export class AuthService {
    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
        private readonly configService: ConfigService,
        private readonly promoCodesService: PromoCodesService,
    ) { }

    // Legacy SHA-256 encryption (for migration)
    private encryptLegacy(password: string): string {
        const secret = this.configService.get<string>('CRYPTOGRAPHY_SECRET') || 'dice_game_secret_key';
        return createHmac('sha256', secret).update(password).digest('hex');
    }

    // New bcrypt hashing
    private async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    private async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    private generateAccessToken(user: User): string {
        const secret = this.configService.get<string>('JWT_SECRET') || 'jwt_secret_change_in_production';
        const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '1h';

        const payload: UserTokenPayload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
        };

        return jwt.sign(payload, secret, { expiresIn: expiresIn as SignOptions['expiresIn'] });
    }

    private generateRefreshToken(user: User): string {
        const secret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'jwt_refresh_secret_change_in_production';
        const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

        const payload: UserTokenPayload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
        };

        return jwt.sign(payload, secret, { expiresIn: expiresIn as SignOptions['expiresIn'] });
    }

    private generateTokens(user: User): { accessToken: string; refreshToken: string } {
        return {
            accessToken: this.generateAccessToken(user),
            refreshToken: this.generateRefreshToken(user),
        };
    }

    async signup(
        authHeader: string,
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        phoneNumber: string,
        role: string,
    ): Promise<UserResponse> {
        const secret = this.configService.get<string>('CRYPTOGRAPHY_SECRET') || 'dice_game_secret_key';
        if (authHeader !== secret) {
            return { status: 401, message: 'Invalid or missing auth header token' };
        }

        return this._createUser(email, password, firstName, lastName, phoneNumber, role);
    }

    async publicSignup(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        phoneNumber: string,
        promoCode?: string,
    ): Promise<UserLoginResponse> {
        const user = await this._createUserAndReturn(email, password, firstName, lastName, phoneNumber, 'user');

        // Apply promo code bonus if provided
        let balance = user.balance || 0;
        if (promoCode) {
            try {
                const bonusAmount = await this.promoCodesService.validateAndUse(promoCode);
                balance += bonusAmount;
                await this.userModel.findByIdAndUpdate(user._id, { balance }).exec();
            } catch (error) {
                // Don't fail registration if promo code is invalid — just skip the bonus
                console.warn(`[AuthService] Promo code "${promoCode}" failed: ${error.message}`);
            }
        }

        const tokens = this.generateTokens(user);

        return {
            ...tokens,
            user: {
                uid: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                balance,
                stripeAccountId: user.stripeAccountId,
                isStripeConnected: user.isStripeConnected,
            },
        };
    }

    private async _createUser(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        phoneNumber: string,
        role: string,
    ): Promise<UserResponse> {
        const user = await this._createUserAndReturn(email, password, firstName, lastName, phoneNumber, role);

        return {
            uid: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            balance: user.balance || 0,
            stripeAccountId: user.stripeAccountId,
            isStripeConnected: user.isStripeConnected,
        };
    }

    private async _createUserAndReturn(
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        phoneNumber: string,
        role: string,
    ): Promise<User> {
        const existingUser = await this.userModel.findOne({ $or: [{ phoneNumber }, { email }] }).exec();
        if (existingUser) {
            if (existingUser.phoneNumber === phoneNumber) {
                throw new BadRequestException('User with this number already exists');
            }
            if (existingUser.email === email) {
                throw new BadRequestException('User with this email already exists');
            }
        }

        // Use bcrypt for new users
        const hashedPassword = await this.hashPassword(password);

        const newUser = new this.userModel({
            email: email?.toLowerCase(),
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber,
            role: role || 'user',
            status: 'active',
            createdAt: new Date(),
        });

        return await newUser.save();
    }

    async login(authHeader: string, phoneNumber: string, password: string, email?: string): Promise<UserLoginResponse> {
        // Build query
        const query: any = {};
        if (phoneNumber) {
            query.phoneNumber = phoneNumber;
        } else if (email) {
            query.email = email.toLowerCase();
        } else {
            throw new BadRequestException('Please provide email or phone number');
        }

        const user = await this.userModel.findOne(query).exec();
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is blocked
        if (user.status === 'banned' || user.status === 'suspended') {
            throw new UnauthorizedException('Account is blocked');
        }

        // Try bcrypt first (new users)
        let isValid = false;
        try {
            isValid = await this.verifyPassword(password, user.password);
        } catch {
            isValid = false;
        }

        // Fallback to legacy SHA-256 (existing users) and migrate
        if (!isValid) {
            const legacyHash = this.encryptLegacy(password);
            if (user.password === legacyHash) {
                isValid = true;
                // Migrate to bcrypt
                const newHash = await this.hashPassword(password);
                await this.userModel.findByIdAndUpdate(user._id, { password: newHash });
                console.log(`[AuthService] Migrated user ${user._id} password from SHA-256 to bcrypt`);
            }
        }

        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.userModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

        // Generate tokens
        const tokens = this.generateTokens(user);

        return {
            ...tokens,
            user: {
                uid: user._id.toString(),
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                balance: user.balance || 0,
                stripeAccountId: user.stripeAccountId,
                isStripeConnected: user.isStripeConnected,
            },
        };
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const secret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'jwt_refresh_secret_change_in_production';
            const payload = jwt.verify(refreshToken, secret) as UserTokenPayload;

            const user = await this.userModel.findById(payload.sub).exec();
            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            if (user.status === 'banned' || user.status === 'suspended') {
                throw new UnauthorizedException('Account is blocked');
            }

            return { accessToken: this.generateAccessToken(user) };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedException('Refresh token expired');
            }
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async getMe(userId: string): Promise<any> {
        const user = await this.userModel.findById(userId).select('-password').exec();
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            uid: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            balance: user.balance || 0,
            status: user.status,
            stripeAccountId: user.stripeAccountId,
            isStripeConnected: user.isStripeConnected,
        };
    }
}
