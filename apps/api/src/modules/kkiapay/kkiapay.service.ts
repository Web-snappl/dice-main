import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { User } from '../auth/auth.mongoSchema';
import { Transaction } from '../../common/transactions.mongoSchema';

@Injectable()
export class KkiapayService {
    private readonly logger = new Logger(KkiapayService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.kkiapay.me/api/v1';

    constructor(
        private configService: ConfigService,
        @InjectModel('users') private userModel: Model<User>,
        @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    ) {
        this.apiKey = this.configService.get<string>('KKIAPAY_PRIVATE_KEY');
    }

    async processDeposit(userId: string, transactionId: string) {
        if (!transactionId) {
            throw new BadRequestException('Transaction ID is required');
        }

        this.logger.log(`Processing deposit for user: ${userId}, tx: ${transactionId}`);

        // 1. Check if transaction already processed
        // We look for SUCCESS or PENDING_BALANCE (which implies we might have failed midway, so we should re-verify or resume)
        // For simplicity: if allows retry, we check only SUCCESS.
        const existingTx = await this.transactionModel.findOne({ referenceId: transactionId });
        if (existingTx) {
            if (existingTx.status === 'SUCCESS') {
                this.logger.log(`Transaction ${transactionId} already processed successfully.`);
                // If the user reports balance not updated, it might be that the balance update failed but tx was saved as SUCCESS?
                // In our new logic, we only set SUCCESS after balance update.
                // But for legacy data, we trust it.
                return { status: 'success', message: 'Already processed', newBalance: null };
            }
            // If status is PENDING or FAILED, we might allow retry?
            // Kkiapay transaction IDs are unique, so we can retry if it wasn't successful.
            this.logger.warn(`Transaction ${transactionId} exists with status: ${existingTx.status}. Retrying verification...`);
        }

        // 2. Verify with Kkiapay
        let kkiapayData;
        try {
            if (!this.apiKey) {
                this.logger.warn('KKIAPAY_PRIVATE_KEY not configured');
            }

            this.logger.log(`Verifying Kkiapay transaction: ${transactionId}`);
            const response = await axios.get(`${this.baseUrl}/transactions/${transactionId}`, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Accept': 'application/json',
                },
            });
            kkiapayData = response.data;
            this.logger.log(`Kkiapay Response Code: ${response.status}, Status: ${kkiapayData.status}, Amount: ${kkiapayData.amount}`);
        } catch (error) {
            this.logger.error(`Kkiapay API verification failed: ${error.message}`, error.response?.data);
            if (error.response?.status === 404) {
                throw new BadRequestException('Transaction not found at Kkiapay');
            }
            throw new InternalServerErrorException('Failed to verify transaction with Kkiapay');
        }

        // 3. Check status
        if (kkiapayData.status !== 'SUCCESS') {
            this.logger.warn(`Transaction ${transactionId} status is ${kkiapayData.status}`);
            throw new BadRequestException(`Payment not successful (Status: ${kkiapayData.status})`);
        }

        // 4. Update User Balance (Robust Way)
        const amount = Number(kkiapayData.amount);

        // a. Save Transaction as PENDING_BALANCE first
        // If we fail here, nothing bad happens (just no record logic started)
        let txRecord;
        if (existingTx) {
            txRecord = existingTx;
            txRecord.status = 'PENDING_BALANCE';
            txRecord.amount = amount; // Ensure amount matches
            await txRecord.save();
        } else {
            txRecord = new this.transactionModel({
                userId: userId,
                userName: kkiapayData.client?.fullname || 'Unknown',
                type: 'DEPOSIT',
                amount: amount,
                status: 'PENDING_BALANCE', // Intermediate status
                method: 'KKIAPAY',
                referenceId: transactionId,
                timestamp: new Date(),
            });
            await txRecord.save();
        }

        try {
            // b. Update User Balance
            this.logger.log(`Updating balance for user ${userId} by ${amount}`);
            const updatedUser = await this.userModel.findByIdAndUpdate(
                userId,
                { $inc: { balance: amount } },
                { new: true }
            );

            if (!updatedUser) {
                throw new NotFoundException('User not found');
            }


            // c. Update Transaction to SUCCESS
            txRecord.status = 'SUCCESS';
            await txRecord.save();

            this.logger.log(`Successfully credited ${amount} CFA to user ${userId}. New Balance: ${updatedUser.balance}`);

            // Return full user object for immediate frontend update
            const userResponse = {
                uid: updatedUser._id.toString(),
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                phoneNumber: updatedUser.phoneNumber,
                role: updatedUser.role,
                balance: updatedUser.balance || 0,
                status: updatedUser.status,
                stripeAccountId: updatedUser.stripeAccountId,
                isStripeConnected: updatedUser.isStripeConnected,
            };

            return {
                status: 'success',
                user: userResponse,
                newBalance: updatedUser.balance,
                amount: amount
            };

        } catch (error) {
            this.logger.error(`Failed to update balance or save final status for user ${userId}: ${error.message}`);

            // Mark transaction as failed due to balance update
            txRecord.status = 'FAILED_BALANCE_UPDATE';
            txRecord.adminNote = 'Failed to update user balance: ' + error.message;
            await txRecord.save();

            throw new InternalServerErrorException('Failed to credit user account. Please contact support.');
        }
    }

    async requestWithdrawal(userId: string, amount: number, phoneNumber: string) {
        if (amount <= 0) {
            throw new BadRequestException('Amount must be greater than 0');
        }

        // 1. Atomic Balance Deduction
        // Find user with sufficient balance and deduct
        const updatedUser = await this.userModel.findOneAndUpdate(
            { _id: userId, balance: { $gte: amount } },
            { $inc: { balance: -amount } },
            { new: true }
        );

        if (!updatedUser) {
            // Either user not found or insufficient balance
            const user = await this.userModel.findById(userId);
            if (!user) throw new NotFoundException('User not found');
            throw new BadRequestException('Insufficient balance');
        }

        try {
            // 2. Create Transaction Request
            const newTx = new this.transactionModel({
                userId: userId,
                userName: `${updatedUser.firstName} ${updatedUser.lastName}`,
                type: 'WITHDRAW', // Matches TransactionType enum logic usually
                amount: amount,
                status: 'PENDING',
                method: 'KKIAPAY', // Or 'MOBILE_MONEY'
                accountNumber: phoneNumber,
                referenceId: `REQ_${Date.now()}_${userId.substring(0, 6)}`,
                timestamp: new Date(),
            });

            await newTx.save();

            this.logger.log(`Withdrawal request created for user ${userId}: ${amount} CFA`);

            return {
                status: 'success',
                message: 'Withdrawal request submitted',
                newBalance: updatedUser.balance
            };

        } catch (error) {
            // Rollback balance if tx creation fails (rare but possible)
            this.logger.error(`Failed to create withdrawal transaction: ${error.message}. Rolling back balance.`);
            await this.userModel.findByIdAndUpdate(userId, { $inc: { balance: amount } });
            throw new InternalServerErrorException('Failed to process withdrawal request');
        }
    }
}
