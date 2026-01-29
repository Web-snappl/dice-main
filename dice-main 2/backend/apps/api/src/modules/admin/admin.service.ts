import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/auth.mongoSchema';
import { Deposit } from '../../common/deposits.mongoSchema';
import { GameHistoryModel } from '../../common/gameHistory.mongoSchema';
import { Withdrawal } from '../../common/withdrawals.mongoSchema';
import { createHmac } from 'node:crypto';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel('users') private readonly userModel: Model<User>,
        @InjectModel(Deposit.name) private readonly depositModel: Model<Deposit>,
        @InjectModel(GameHistoryModel.name) private readonly gameHistoryModel: Model<GameHistoryModel>,
        @InjectModel(Withdrawal.name) private readonly withdrawalModel: Model<Withdrawal>,
    ) { }

    private encrypt(password: string): string {
        const secret = process.env.CRYPTOGRAPHY_SECRET || 'dice_game_secret_key';
        return createHmac('sha256', secret).update(password).digest('hex');
    }

    async login(email: string, password: string) {
        const encryptedPassword = this.encrypt(password);
        const user = await this.userModel.findOne({ email }).exec();

        if (!user || user.password !== encryptedPassword) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.role !== 'admin' && user.role !== 'Admin') {
            throw new UnauthorizedException('Access denied: Admins only');
        }

        // Return a mock token for now since we haven't set up full JWT strategy yet
        // In real prod, this should generate a signed JWT
        // We reuse the user ID/Details as a simple session identifier for this MVP phase
        return {
            accessToken: 'admin-session-' + user._id,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        };
    }

    async getUsers(query: any) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await this.userModel.find()
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .exec();

        const total = await this.userModel.countDocuments();

        // Calculate a "balance" for each user based on deposits/withdrawals/gameplay if strictly needed,
        // OR rely on a stored balance field. Looking at schemas, `User` schema doesn't seem to have `balance`.
        // We might need to aggregate it or add it.
        // For MVP, if balance isn't in User schema, we mock it or aggregate it.
        // The Gap Report said "Coin Balance editing". 
        // Let's assume for now we return 0 if field missing, or aggregate.
        // *CRITICAL*: User schema has `pendingEarnings` in `deferredOnboarding` but no main balance.
        // We will stick to the Schema we saw.

        return {
            users: users.map(u => ({
                ...u.toObject(),
                id: u._id,
                balance: 0 // Placeholder until balance schema is clarified or aggregation added
            })),
            total,
            page,
            limit
        };
    }

    async getUser(id: string) {
        const user = await this.userModel.findById(id).select('-password');
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateUser(id: string, data: any) {
        // Since Schema doesn't have 'balance' directly at root, we need to be careful.
        // If the Admin Panel sends 'balance', where do we save it?
        // Detailed check of User schema needed.
        // For now, we update mutable fields.
        const user = await this.userModel.findByIdAndUpdate(id, data, { new: true });
        return { success: true, user };
    }

    async getDashboardStats() {
        const totalUsers = await this.userModel.countDocuments();
        const totalGames = await this.gameHistoryModel.countDocuments();
        // Basic stats
        return {
            users: { total: totalUsers, activeToday: 0 }, // Active today requires logs we don't have
            games: { totalPlayed: totalGames },
            financial: {
                coinsInCirculation: 0, // Placeholder
                coinsPurchasedToday: 0
            }
        };
    }

    async getTransactions(query: any) {
        const deposits = await this.depositModel.find().sort({ timestamp: -1 }).limit(50);
        // Map to standard transaction format
        return {
            transactions: deposits.map(d => ({
                id: d._id,
                userId: d.uid,
                userName: d.displayName,
                amount: d.amount,
                type: 'COIN_PURCHASE',
                timestamp: d.timestamp
            })),
            total: deposits.length
        };
    }

    async getFinancialSummary() {
        const deposits = await this.depositModel.find();
        const totalAmount = deposits.reduce((sum, d) => sum + d.amount, 0);

        return {
            deposits: {
                count: deposits.length,
                totalAmount
            },
            rewards: { count: 0, breakdown: {} }
        };
    }
}
