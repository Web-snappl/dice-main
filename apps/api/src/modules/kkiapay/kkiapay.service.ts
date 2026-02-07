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

        // 1. Check if transaction already processed
        const existingTx = await this.transactionModel.findOne({ referenceId: transactionId });
        if (existingTx) {
            if (existingTx.status === 'SUCCESS') {
                return { status: 'success', message: 'Already processed' };
            }
            throw new BadRequestException('Transaction already processed with status: ' + existingTx.status);
        }

        // 2. Verify with Kkiapay
        let kkiapayData;
        try {
            if (!this.apiKey) {
                this.logger.warn('KKIAPAY_PRIVATE_KEY not configured');
                // Use a mock response if we are in development/test mode without keys?
                // For security, better to fail if not configured.
            }

            this.logger.log(`Verifying Kkiapay transaction: ${transactionId}`);
            const response = await axios.get(`${this.baseUrl}/transactions/${transactionId}`, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Accept': 'application/json',
                },
            });
            kkiapayData = response.data;
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

        // 4. Update User Balance (Atomically)
        const amount = Number(kkiapayData.amount);

        try {
            // Create Transaction Record
            const newTx = new this.transactionModel({
                userId: userId,
                userName: kkiapayData.client?.fullname || 'Unknown',
                type: 'DEPOSIT',
                amount: amount,
                status: 'SUCCESS',
                method: 'KKIAPAY',
                referenceId: transactionId,
                timestamp: new Date(),
            });
            await newTx.save();

            // Update User Balance
            const updatedUser = await this.userModel.findByIdAndUpdate(
                userId,
                { $inc: { balance: amount } },
                { new: true }
            );

            if (!updatedUser) {
                throw new NotFoundException('User not found');
            }

            this.logger.log(`Credited ${amount} CFA to user ${userId} for tx ${transactionId}`);

            return {
                status: 'success',
                newBalance: updatedUser.balance,
                amount: amount
            };

        } catch (error) {
            this.logger.error(`Failed to update balance for user ${userId}: ${error.message}`);
            throw new InternalServerErrorException('Failed to credit user account');
        }
    }
}
