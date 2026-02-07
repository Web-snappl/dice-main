import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../auth/auth.mongoSchema';
import { Transaction } from '../../common/transactions.mongoSchema';

type ProviderVerificationPayload = Record<string, any>;

@Injectable()
export class KkiapayService {
    private readonly logger = new Logger(KkiapayService.name);
    private readonly liveBaseUrl = 'https://api.kkiapay.me';
    private readonly sandboxBaseUrl = 'https://api-sandbox.kkiapay.me';

    constructor(
        private readonly configService: ConfigService,
        @InjectModel('users') private readonly userModel: Model<User>,
        @InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>,
    ) { }

    async createDepositIntent(userId: string, amount: number, phoneNumber?: string) {
        const normalizedAmount = this.normalizeAmount(amount);
        const user = await this.userModel.findById(userId).select('firstName lastName').exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const referenceId = this.createReferenceId(userId);
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
        const expectedCurrency = this.configService.get<string>('KKIAPAY_CURRENCY') || 'XOF';

        const tx = new this.transactionModel({
            userId,
            userName,
            type: 'DEPOSIT',
            amount: normalizedAmount,
            status: 'PENDING',
            method: 'KKIAPAY',
            accountNumber: phoneNumber,
            referenceId,
            currency: expectedCurrency,
            adminNote: 'Deposit intent created',
            timestamp: new Date(),
        });
        await tx.save();

        this.logger.log(`Created Kkiapay deposit intent ref=${referenceId} user=${userId} amount=${normalizedAmount}`);

        return {
            status: 'PENDING',
            referenceId,
            amount: normalizedAmount,
            currency: expectedCurrency,
            kkiapay: {
                sandbox: this.configService.get<string>('KKIAPAY_SANDBOX') === 'true',
                publicKey: this.configService.get<string>('KKIAPAY_PUBLIC_KEY') || null,
                metadata: { referenceId },
            },
        };
    }

    async processDeposit(userId: string, transactionId: string, referenceId: string) {
        const normalizedTransactionId = (transactionId || '').trim();
        const normalizedReferenceId = (referenceId || '').trim();

        if (!normalizedTransactionId) {
            throw new BadRequestException('Transaction ID is required');
        }
        if (!normalizedReferenceId) {
            throw new BadRequestException('Reference ID is required');
        }

        const intent = await this.transactionModel.findOne({
            userId,
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            referenceId: normalizedReferenceId,
        });

        if (!intent) {
            throw new NotFoundException('Deposit intent not found');
        }

        if (intent.status === 'SUCCESS') {
            const user = await this.findUserById(userId);
            return {
                status: 'success',
                message: 'Deposit already processed',
                referenceId: normalizedReferenceId,
                transactionId: intent.providerTransactionId || normalizedTransactionId,
                amount: intent.amount,
                user: user ? this.toUserResponse(user) : null,
                transaction: this.toTransactionResponse(intent),
            };
        }

        if (intent.providerTransactionId && intent.providerTransactionId !== normalizedTransactionId) {
            throw new ConflictException('Intent is already linked to a different provider transaction');
        }

        const providerData = await this.verifyTransactionWithProvider(normalizedTransactionId);
        const providerStatus = this.extractProviderStatus(providerData);

        if (!this.isSuccessfulProviderStatus(providerStatus)) {
            await this.transactionModel.updateOne(
                { _id: intent._id },
                {
                    $set: {
                        status: 'FAILED',
                        providerTransactionId: normalizedTransactionId,
                        adminNote: `Provider status: ${providerStatus || 'UNKNOWN'}`,
                    },
                },
            );
            throw new BadRequestException(`Payment not successful (Status: ${providerStatus || 'UNKNOWN'})`);
        }

        const providerAmount = this.extractProviderAmount(providerData);
        const expectedAmount = Number(intent.amount);
        if (!Number.isFinite(providerAmount)) {
            await this.transactionModel.updateOne(
                { _id: intent._id },
                {
                    $set: {
                        status: 'FAILED',
                        providerTransactionId: normalizedTransactionId,
                        adminNote: 'Provider amount missing/invalid',
                    },
                },
            );
            throw new BadRequestException('Provider amount is missing or invalid');
        }
        if (Math.abs(providerAmount - expectedAmount) > 0.01) {
            await this.transactionModel.updateOne(
                { _id: intent._id },
                {
                    $set: {
                        status: 'FAILED',
                        providerTransactionId: normalizedTransactionId,
                        adminNote: `Amount mismatch. Expected=${expectedAmount}, Provider=${providerAmount}`,
                    },
                },
            );
            throw new BadRequestException('Provider amount does not match deposit intent amount');
        }

        const intentCurrency = (intent as any).currency;
        const providerCurrency = this.extractProviderCurrency(providerData);
        if (providerCurrency && intentCurrency && providerCurrency !== intentCurrency) {
            await this.transactionModel.updateOne(
                { _id: intent._id },
                {
                    $set: {
                        status: 'FAILED',
                        providerTransactionId: normalizedTransactionId,
                        adminNote: `Currency mismatch. Expected=${intentCurrency}, Provider=${providerCurrency}`,
                    },
                },
            );
            throw new BadRequestException('Provider currency does not match deposit intent currency');
        }

        const providerReference = this.extractProviderReference(providerData);
        const requireReferenceMatch = this.configService.get<string>('KKIAPAY_REQUIRE_REFERENCE_MATCH') !== 'false';
        if (requireReferenceMatch && !providerReference) {
            await this.transactionModel.updateOne(
                { _id: intent._id },
                {
                    $set: {
                        status: 'FAILED',
                        providerTransactionId: normalizedTransactionId,
                        adminNote: 'Provider reference missing in verification payload',
                    },
                },
            );
            throw new BadRequestException('Provider reference is missing; verification rejected');
        }
        if (providerReference && providerReference !== normalizedReferenceId) {
            await this.transactionModel.updateOne(
                { _id: intent._id },
                {
                    $set: {
                        status: 'FAILED',
                        providerTransactionId: normalizedTransactionId,
                        adminNote: `Reference mismatch. Expected=${normalizedReferenceId}, Provider=${providerReference}`,
                    },
                },
            );
            throw new BadRequestException('Provider reference does not match deposit intent reference');
        }

        const duplicateSuccess = await this.transactionModel.findOne({
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            status: 'SUCCESS',
            providerTransactionId: normalizedTransactionId,
            _id: { $ne: intent._id },
        });
        if (duplicateSuccess) {
            throw new ConflictException('This provider transaction was already credited');
        }

        const session = await this.transactionModel.db.startSession();
        let finalUser: User | null = null;
        let finalTx: Transaction | null = null;

        try {
            await session.withTransaction(async () => {
                const tx = await this.transactionModel.findOne({
                    _id: intent._id,
                    userId,
                    referenceId: normalizedReferenceId,
                    type: 'DEPOSIT',
                    method: 'KKIAPAY',
                }).session(session);

                if (!tx) {
                    throw new NotFoundException('Deposit intent not found');
                }

                if (tx.status === 'SUCCESS') {
                    finalUser = await this.findUserById(userId, session);
                    finalTx = tx;
                    return;
                }

                if (tx.providerTransactionId && tx.providerTransactionId !== normalizedTransactionId) {
                    throw new ConflictException('Intent is already linked to a different provider transaction');
                }

                const duplicate = await this.transactionModel.findOne({
                    type: 'DEPOSIT',
                    method: 'KKIAPAY',
                    status: 'SUCCESS',
                    providerTransactionId: normalizedTransactionId,
                    _id: { $ne: tx._id },
                }).session(session);
                if (duplicate) {
                    throw new ConflictException('This provider transaction was already credited');
                }

                const updatedUser = await this.userModel.findByIdAndUpdate(
                    userId,
                    { $inc: { balance: expectedAmount } },
                    { new: true, session },
                );

                if (!updatedUser) {
                    throw new NotFoundException('User not found');
                }

                tx.status = 'SUCCESS';
                tx.amount = expectedAmount;
                tx.providerTransactionId = normalizedTransactionId;
                tx.verifiedAt = new Date();
                tx.adminNote = 'Verified with Kkiapay and credited';
                await tx.save({ session });

                finalUser = updatedUser;
                finalTx = tx;
            });
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof NotFoundException) {
                throw error;
            }

            this.logger.error(`Failed to credit Kkiapay deposit ref=${normalizedReferenceId}: ${error.message}`);
            await this.transactionModel.updateOne(
                { _id: intent._id, status: { $ne: 'SUCCESS' } },
                {
                    $set: {
                        status: 'FAILED',
                        providerTransactionId: normalizedTransactionId,
                        adminNote: `Atomic credit failed: ${error.message}`,
                    },
                },
            );
            throw new InternalServerErrorException('Failed to credit user account');
        } finally {
            await session.endSession();
        }

        if (!finalUser) {
            finalUser = await this.findUserById(userId);
        }
        if (!finalTx) {
            finalTx = await this.transactionModel.findById(intent._id).exec();
        }

        this.logger.log(
            `Kkiapay deposit credited user=${userId} ref=${normalizedReferenceId} tx=${normalizedTransactionId} amount=${expectedAmount}`,
        );

        return {
            status: 'success',
            message: 'Deposit verified and credited',
            referenceId: normalizedReferenceId,
            transactionId: normalizedTransactionId,
            amount: expectedAmount,
            user: finalUser ? this.toUserResponse(finalUser) : null,
            transaction: finalTx ? this.toTransactionResponse(finalTx) : null,
        };
    }

    async getDepositStatus(userId: string, referenceId: string) {
        const tx = await this.transactionModel.findOne({
            userId,
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            referenceId,
        });

        if (!tx) {
            throw new NotFoundException('Deposit intent not found');
        }

        return {
            referenceId: tx.referenceId,
            status: tx.status,
            amount: tx.amount,
            currency: (tx as any).currency || null,
            providerTransactionId: tx.providerTransactionId || null,
            timestamp: tx.timestamp,
        };
    }

    async handleWebhook(payload: Record<string, any>, signature?: string) {
        this.assertWebhookSignature(signature);

        const transactionId = String(payload?.transactionId || '').trim();
        if (!transactionId) {
            throw new BadRequestException('Missing transactionId in webhook payload');
        }

        const event = String(payload?.event || payload?.type || '').trim().toLowerCase();
        const isSuccessEvent = payload?.isPaymentSucces === true || event === 'transaction.success';
        const isFailureEvent = payload?.isPaymentSucces === false || event === 'transaction.failed';

        const referenceId = await this.resolveWebhookReference(payload, transactionId);
        if (!referenceId) {
            this.logger.warn(`Ignoring Kkiapay webhook tx=${transactionId}: missing referenceId`);
            return { status: 'ignored', reason: 'missing_reference', transactionId };
        }

        const intent = await this.transactionModel.findOne({
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            referenceId,
        }).exec();

        if (!intent) {
            this.logger.warn(`Ignoring Kkiapay webhook tx=${transactionId}: intent not found for ref=${referenceId}`);
            return { status: 'ignored', reason: 'intent_not_found', referenceId, transactionId };
        }

        if (isSuccessEvent) {
            const result = await this.processDeposit(intent.userId, transactionId, referenceId);
            return {
                status: 'processed',
                referenceId,
                transactionId,
                resultStatus: result.status,
            };
        }

        if (isFailureEvent) {
            await this.transactionModel.updateOne(
                {
                    _id: intent._id,
                    status: { $in: ['PENDING'] },
                },
                {
                    $set: {
                        status: 'FAILED',
                        providerTransactionId: transactionId,
                        adminNote: `Webhook failure event: ${event || 'transaction.failed'}`,
                        verifiedAt: new Date(),
                    },
                },
            );
            return { status: 'processed', referenceId, transactionId, resultStatus: 'FAILED' };
        }

        return { status: 'ignored', reason: 'unsupported_event', event, referenceId, transactionId };
    }

    async requestWithdrawal(userId: string, amount: number, phoneNumber: string, requestId?: string) {
        const normalizedAmount = this.normalizeAmount(amount);
        const normalizedPhoneNumber = this.normalizePhoneNumber(phoneNumber);
        const normalizedRequestId = this.normalizeRequestId(requestId);
        const referenceId = normalizedRequestId
            ? `WREQ_${normalizedRequestId}`
            : this.createWithdrawalReferenceId(userId);

        if (normalizedRequestId) {
            const existing = await this.transactionModel.findOne({
                userId,
                type: 'WITHDRAW',
                method: 'KKIAPAY',
                referenceId,
            });

            if (existing) {
                const user = await this.findUserById(userId);
                return {
                    status: 'success',
                    idempotent: true,
                    message: 'Withdrawal request already submitted',
                    referenceId: existing.referenceId,
                    newBalance: user ? Number(user.balance) || 0 : null,
                    user: user ? this.toUserResponse(user) : null,
                    transaction: this.toTransactionResponse(existing),
                };
            }
        }

        const expectedCurrency = this.configService.get<string>('KKIAPAY_CURRENCY') || 'XOF';
        const session = await this.transactionModel.db.startSession();
        let finalUser: User | null = null;
        let finalTx: Transaction | null = null;

        try {
            await session.withTransaction(async () => {
                const updatedUser = await this.userModel.findOneAndUpdate(
                    { _id: userId, balance: { $gte: normalizedAmount } },
                    { $inc: { balance: -normalizedAmount } },
                    { new: true, session },
                );

                if (!updatedUser) {
                    const user = await this.findUserById(userId, session);
                    if (!user) {
                        throw new NotFoundException('User not found');
                    }
                    throw new BadRequestException('Insufficient balance');
                }

                const newTx = new this.transactionModel({
                    userId,
                    userName: `${updatedUser.firstName} ${updatedUser.lastName}`.trim() || 'Unknown',
                    type: 'WITHDRAW',
                    amount: normalizedAmount,
                    status: 'PENDING',
                    method: 'KKIAPAY',
                    accountNumber: normalizedPhoneNumber,
                    referenceId,
                    currency: expectedCurrency,
                    adminNote: 'Withdrawal requested',
                    timestamp: new Date(),
                });
                await newTx.save({ session });

                finalUser = updatedUser;
                finalTx = newTx;
            });
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            this.logger.error(`Failed to process withdrawal request user=${userId}: ${error.message}`);
            throw new InternalServerErrorException('Failed to process withdrawal request');
        } finally {
            await session.endSession();
        }

        if (!finalUser) {
            finalUser = await this.findUserById(userId);
        }
        if (!finalTx) {
            finalTx = await this.transactionModel.findOne({
                userId,
                type: 'WITHDRAW',
                method: 'KKIAPAY',
                referenceId,
            }).exec();
        }

        this.logger.log(`Withdrawal request created user=${userId} ref=${referenceId} amount=${normalizedAmount}`);

        return {
            status: 'success',
            message: 'Withdrawal request submitted',
            referenceId,
            newBalance: finalUser ? Number(finalUser.balance) || 0 : null,
            user: finalUser ? this.toUserResponse(finalUser) : null,
            transaction: finalTx ? this.toTransactionResponse(finalTx) : null,
        };
    }

    private createReferenceId(userId: string): string {
        return `KKI_${Date.now()}_${userId.slice(-6)}_${uuidv4().slice(0, 8)}`;
    }

    private createWithdrawalReferenceId(userId: string): string {
        return `KKO_${Date.now()}_${userId.slice(-6)}_${uuidv4().slice(0, 8)}`;
    }

    private normalizeAmount(amount: number): number {
        const numeric = Number(amount);
        if (!Number.isFinite(numeric) || numeric <= 0) {
            throw new BadRequestException('Amount must be greater than 0');
        }

        if (Math.abs(numeric - Math.round(numeric)) > 0.001) {
            throw new BadRequestException('Amount must be an integer');
        }

        return Math.round(numeric);
    }

    private normalizePhoneNumber(phoneNumber: string): string {
        const normalized = String(phoneNumber || '').trim().replace(/\s+/g, '');
        if (!/^\+?[0-9]{8,15}$/.test(normalized)) {
            throw new BadRequestException('Invalid phone number format');
        }
        return normalized;
    }

    private normalizeRequestId(requestId?: string): string | null {
        const normalized = String(requestId || '').trim();
        if (!normalized) {
            return null;
        }
        if (!/^[A-Za-z0-9_-]{8,128}$/.test(normalized)) {
            throw new BadRequestException('Invalid requestId format');
        }
        return normalized;
    }

    private assertWebhookSignature(signature?: string) {
        const secret = String(this.configService.get<string>('KKIAPAY_WEBHOOK_SECRET') || '').trim();
        if (!secret) {
            this.logger.error('KKIAPAY_WEBHOOK_SECRET is not configured');
            throw new InternalServerErrorException('Webhook verification is not configured');
        }

        const normalizedSignature = String(signature || '').trim();
        if (!normalizedSignature) {
            throw new UnauthorizedException('Missing webhook signature');
        }

        const incoming = Buffer.from(normalizedSignature);
        const expected = Buffer.from(secret);
        if (incoming.length !== expected.length || !timingSafeEqual(incoming, expected)) {
            throw new UnauthorizedException('Invalid webhook signature');
        }
    }

    private async verifyTransactionWithProvider(transactionId: string): Promise<ProviderVerificationPayload> {
        const publicKey = this.configService.get<string>('KKIAPAY_PUBLIC_KEY');
        const privateKey = this.configService.get<string>('KKIAPAY_PRIVATE_KEY');
        const secretKey = this.configService.get<string>('KKIAPAY_SECRET');

        if (!publicKey || !privateKey || !secretKey) {
            this.logger.error('KKIAPAY_PUBLIC_KEY, KKIAPAY_PRIVATE_KEY and KKIAPAY_SECRET must be configured');
            throw new InternalServerErrorException('Payment provider is not configured');
        }

        const isSandbox = this.configService.get<string>('KKIAPAY_SANDBOX') === 'true';
        const baseUrl = isSandbox ? this.sandboxBaseUrl : this.liveBaseUrl;

        try {
            const response = await axios.post(`${baseUrl}/api/v1/transactions/status`, {
                transactionId,
            }, {
                headers: {
                    'x-api-key': publicKey,
                    'x-secret-key': secretKey,
                    'x-private-key': privateKey,
                    Accept: 'application/json',
                },
            });
            const data = response.data?.data ?? response.data;
            this.logger.log(`Kkiapay verification response tx=${transactionId} status=${data?.status}`);
            return data;
        } catch (error) {
            const providerMessage = error.response?.data?.reason || error.response?.data?.message || error.response?.data?.status;
            this.logger.error(`Kkiapay verification failed for tx=${transactionId}: ${error.message}`, error.response?.data);

            if (
                error.response?.status === 404
                || String(providerMessage || '').toUpperCase().includes('TRANSACTION_NOT_FOUND')
            ) {
                throw new BadRequestException('Transaction not found at Kkiapay');
            }

            if (providerMessage) {
                throw new BadRequestException(`Kkiapay verification rejected: ${providerMessage}`);
            }

            throw new InternalServerErrorException('Failed to verify transaction with Kkiapay');
        }
    }

    private extractProviderStatus(payload: ProviderVerificationPayload): string {
        return String(payload?.status || payload?.state || payload?.paymentStatus || '').trim().toUpperCase();
    }

    private isSuccessfulProviderStatus(status: string): boolean {
        return ['SUCCESS', 'PAYMENT_SUCCESS', 'COMPLETED', 'PAID'].includes(status);
    }

    private extractProviderAmount(payload: ProviderVerificationPayload): number {
        const raw = payload?.amount ?? payload?.total ?? payload?.transaction?.amount;
        const amount = Number(raw);
        return Number.isFinite(amount) ? amount : NaN;
    }

    private extractProviderCurrency(payload: ProviderVerificationPayload): string | null {
        const value = payload?.currency || payload?.transaction?.currency || payload?.payment?.currency;
        if (!value) {
            return null;
        }
        return String(value).trim().toUpperCase();
    }

    private extractProviderReference(payload: ProviderVerificationPayload): string | null {
        const candidates = [
            payload?.metadata?.referenceId,
            payload?.metadata?.reference,
            payload?.data,
            payload?.reference,
            payload?.externalId,
            payload?.orderId,
        ];

        const value = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
        return value ? String(value).trim() : null;
    }

    private async resolveWebhookReference(payload: ProviderVerificationPayload, transactionId: string): Promise<string | null> {
        const fromPayload = this.extractProviderReference({
            ...payload,
            metadata: payload?.metadata || payload?.stateData || {},
            data: payload?.data || payload?.stateData?.data,
            reference: payload?.reference || payload?.referenceId || payload?.stateData?.referenceId,
            externalId: payload?.externalId || payload?.stateData?.reference || payload?.stateData?.externalId,
        });
        if (fromPayload) {
            return fromPayload;
        }

        try {
            const providerData = await this.verifyTransactionWithProvider(transactionId);
            return this.extractProviderReference(providerData);
        } catch (error) {
            this.logger.warn(`Failed to resolve webhook reference via provider tx=${transactionId}: ${error.message}`);
            return null;
        }
    }

    private toUserResponse(user: User) {
        const id = user._id?.toString?.() || user.uid;
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
        const balance = Number(user.balance) || 0;

        return {
            id,
            uid: id,
            name: fullName,
            displayName: fullName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            status: user.status,
            wallet: {
                balance,
                totalDeposited: 0,
                totalWithdrawn: 0,
            },
            balance,
        };
    }

    private toTransactionResponse(tx: Transaction) {
        const date = tx.timestamp ? new Date(tx.timestamp).toISOString() : new Date().toISOString();
        return {
            id: tx._id?.toString?.(),
            userId: tx.userId,
            userName: tx.userName,
            type: tx.type,
            amount: tx.amount,
            status: tx.status,
            method: tx.method,
            accountNumber: tx.accountNumber,
            referenceId: tx.referenceId,
            providerTransactionId: tx.providerTransactionId || null,
            currency: (tx as any).currency || null,
            timestamp: tx.timestamp,
            date,
            adminNote: tx.adminNote,
        };
    }

    private async findUserById(userId: string, session?: any): Promise<User | null> {
        const query: any = this.userModel.findById(userId);
        if (session && typeof query?.session === 'function') {
            query.session(session);
        }
        if (typeof query?.exec === 'function') {
            return query.exec();
        }
        return query;
    }
}
