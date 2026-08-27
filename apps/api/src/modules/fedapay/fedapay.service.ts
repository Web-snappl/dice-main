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
import { createHmac, timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../auth/auth.mongoSchema';
import { Transaction } from '../../common/transactions.mongoSchema';

type ProviderPayload = Record<string, any>;

@Injectable()
export class FedapayService {
    private readonly logger = new Logger(FedapayService.name);
    private readonly liveBaseUrl = 'https://api.fedapay.com';
    private readonly sandboxBaseUrl = 'https://sandbox-api.fedapay.com';
    private readonly successStatuses = ['APPROVED', 'TRANSFERRED', 'PAID'];

    constructor(
        private readonly configService: ConfigService,
        @InjectModel('users') private readonly userModel: Model<User>,
        @InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>,
    ) { }

    async createDepositIntent(userId: string, amount: number, phoneNumber?: string) {
        const normalizedAmount = this.normalizeAmount(amount);
        const normalizedPhone = phoneNumber ? this.normalizePhoneNumber(phoneNumber) : null;

        const user = await this.userModel.findById(userId).select('firstName lastName email phoneNumber').exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const referenceId = this.createReferenceId(userId);
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
        const expectedCurrency = this.getCurrency();

        // 1. Create the transaction with FedaPay
        const fedapayTx = await this.createFedapayTransaction({
            amount: normalizedAmount,
            currency: expectedCurrency,
            description: `Deposit ${referenceId}`,
            referenceId,
            customer: {
                firstname: user.firstName || 'User',
                lastname: user.lastName || 'Unknown',
                email: user.email || `${userId}@nomail.local`,
                phoneNumber: normalizedPhone || user.phoneNumber,
            },
        });

        // 2. Generate checkout token/URL
        const { token, url } = await this.generateCheckoutToken(fedapayTx.id);

        // 3. Persist deposit intent locally
        const tx = new this.transactionModel({
            userId,
            userName,
            type: 'DEPOSIT',
            amount: normalizedAmount,
            status: 'PENDING',
            method: 'FEDAPAY',
            accountNumber: normalizedPhone,
            referenceId,
            providerTransactionId: String(fedapayTx.id),
            currency: expectedCurrency,
            adminNote: 'Deposit intent created',
            timestamp: new Date(),
        });
        await tx.save();

        this.logger.log(`Created FedaPay deposit intent ref=${referenceId} user=${userId} amount=${normalizedAmount} fedapayId=${fedapayTx.id}`);

        return {
            status: 'PENDING',
            referenceId,
            amount: normalizedAmount,
            currency: expectedCurrency,
            paymentUrl: url,
            token,
            providerTransactionId: String(fedapayTx.id),
        };
    }

    async processDeposit(userId: string, providerTransactionId: string, referenceId: string) {
        const normalizedProviderId = (providerTransactionId || '').trim();
        const normalizedReferenceId = (referenceId || '').trim();

        if (!normalizedProviderId) {
            throw new BadRequestException('Provider transaction ID is required');
        }
        if (!normalizedReferenceId) {
            throw new BadRequestException('Reference ID is required');
        }

        const intent = await this.transactionModel.findOne({
            userId,
            type: 'DEPOSIT',
            method: 'FEDAPAY',
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
                transactionId: intent.providerTransactionId || normalizedProviderId,
                amount: intent.amount,
                user: user ? this.toUserResponse(user) : null,
                transaction: this.toTransactionResponse(intent),
            };
        }

        if (intent.providerTransactionId && intent.providerTransactionId !== normalizedProviderId) {
            throw new ConflictException('Intent is already linked to a different provider transaction');
        }

        const providerData = await this.fetchFedapayTransaction(normalizedProviderId);
        const providerStatus = String(providerData?.status || '').trim().toUpperCase();

        if (!this.successStatuses.includes(providerStatus)) {
            await this.transactionModel.updateOne(
                { _id: intent._id },
                {
                    $set: {
                        status: 'FAILED',
                        providerTransactionId: normalizedProviderId,
                        adminNote: `Provider status: ${providerStatus || 'UNKNOWN'}`,
                    },
                },
            );
            throw new BadRequestException(`Payment not successful (Status: ${providerStatus || 'UNKNOWN'})`);
        }

        const providerAmount = Number(providerData?.amount);
        const expectedAmount = Number(intent.amount);
        if (!Number.isFinite(providerAmount)) {
            await this.markIntentFailed(intent._id, normalizedProviderId, 'Provider amount missing/invalid');
            throw new BadRequestException('Provider amount is missing or invalid');
        }
        if (Math.abs(providerAmount - expectedAmount) > 0.01) {
            await this.markIntentFailed(intent._id, normalizedProviderId, `Amount mismatch. Expected=${expectedAmount}, Provider=${providerAmount}`);
            throw new BadRequestException('Provider amount does not match deposit intent amount');
        }

        const providerCurrency = this.extractCurrency(providerData);
        const intentCurrency = (intent as any).currency;
        if (providerCurrency && intentCurrency && providerCurrency !== intentCurrency) {
            await this.markIntentFailed(intent._id, normalizedProviderId, `Currency mismatch. Expected=${intentCurrency}, Provider=${providerCurrency}`);
            throw new BadRequestException('Provider currency does not match deposit intent currency');
        }

        const duplicate = await this.transactionModel.findOne({
            type: 'DEPOSIT',
            method: 'FEDAPAY',
            status: 'SUCCESS',
            providerTransactionId: normalizedProviderId,
            _id: { $ne: intent._id },
        });
        if (duplicate) {
            throw new ConflictException('This provider transaction was already credited');
        }

        // 1. Mark tx SUCCESS first (idempotency)
        intent.status = 'SUCCESS';
        intent.amount = expectedAmount;
        intent.providerTransactionId = normalizedProviderId;
        intent.verifiedAt = new Date();
        intent.adminNote = 'Verified with FedaPay and credited';
        await intent.save();

        // 2. Credit user balance
        let updatedUser;
        try {
            updatedUser = await this.userModel.findByIdAndUpdate(
                userId,
                { $inc: { balance: expectedAmount } },
                { new: true },
            );
        } catch (err) {
            this.logger.error(`CRITICAL: FedaPay tx marked SUCCESS but balance update failed user=${userId} amount=${expectedAmount}: ${err.message}`);
            intent.status = 'FAILED';
            intent.adminNote = `Balance update failed: ${err.message}`;
            await intent.save();
            throw new InternalServerErrorException('Failed to update user balance');
        }

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }

        this.logger.log(`FedaPay deposit credited user=${userId} ref=${normalizedReferenceId} tx=${normalizedProviderId} amount=${expectedAmount}`);

        return {
            status: 'success',
            message: 'Deposit verified and credited',
            referenceId: normalizedReferenceId,
            transactionId: normalizedProviderId,
            amount: expectedAmount,
            user: this.toUserResponse(updatedUser),
            transaction: this.toTransactionResponse(intent),
        };
    }

    async getDepositStatus(userId: string, referenceId: string) {
        const tx = await this.transactionModel.findOne({
            userId,
            type: 'DEPOSIT',
            method: 'FEDAPAY',
            referenceId,
        });

        if (!tx) {
            throw new NotFoundException('Deposit intent not found');
        }

        // If still pending locally, check with FedaPay and auto-credit on success
        if (tx.status === 'PENDING' && tx.providerTransactionId) {
            try {
                const providerData = await this.fetchFedapayTransaction(tx.providerTransactionId);
                const providerStatus = String(providerData?.status || '').trim().toUpperCase();
                if (this.successStatuses.includes(providerStatus)) {
                    return await this.processDeposit(userId, tx.providerTransactionId, referenceId);
                }
                if (['CANCELED', 'DECLINED', 'REFUNDED', 'FAILED'].includes(providerStatus)) {
                    await this.transactionModel.updateOne(
                        { _id: tx._id },
                        { $set: { status: 'FAILED', adminNote: `Provider status: ${providerStatus}` } },
                    );
                    return {
                        referenceId: tx.referenceId,
                        status: 'FAILED',
                        amount: tx.amount,
                        currency: (tx as any).currency || null,
                        providerTransactionId: tx.providerTransactionId,
                        timestamp: tx.timestamp,
                    };
                }
            } catch (err) {
                this.logger.warn(`Failed to poll FedaPay for ref=${referenceId}: ${err.message}`);
            }
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

    async handleWebhook(rawBody: string, signatureHeader?: string) {
        this.verifyWebhookSignature(rawBody, signatureHeader);

        let payload: ProviderPayload;
        try {
            payload = JSON.parse(rawBody);
        } catch {
            throw new BadRequestException('Invalid webhook payload');
        }

        const event = String(payload?.name || payload?.event || '').trim().toLowerCase();
        const entity = payload?.entity || payload?.data || {};
        const providerTransactionId = String(entity?.id || '').trim();
        const providerReference = String(entity?.reference || '').trim();

        if (!providerTransactionId) {
            throw new BadRequestException('Missing transaction id in webhook payload');
        }

        // Look up our local intent by FedaPay transaction id
        const intent = await this.transactionModel.findOne({
            method: 'FEDAPAY',
            providerTransactionId,
        }).exec();

        if (!intent) {
            this.logger.warn(`Ignoring FedaPay webhook tx=${providerTransactionId}: intent not found`);
            return { status: 'ignored', reason: 'intent_not_found', providerTransactionId };
        }

        const isApproved = event.includes('approved') || this.successStatuses.includes(String(entity?.status || '').toUpperCase());
        const isFailure = ['canceled', 'declined', 'failed', 'refunded'].some((k) => event.includes(k));

        if (intent.type === 'DEPOSIT' && isApproved) {
            const result = await this.processDeposit(intent.userId, providerTransactionId, intent.referenceId);
            return {
                status: 'processed',
                referenceId: intent.referenceId,
                transactionId: providerTransactionId,
                resultStatus: result.status,
            };
        }

        if (intent.type === 'DEPOSIT' && isFailure) {
            await this.transactionModel.updateOne(
                { _id: intent._id, status: 'PENDING' },
                {
                    $set: {
                        status: 'FAILED',
                        adminNote: `Webhook failure event: ${event || 'unknown'}`,
                        verifiedAt: new Date(),
                    },
                },
            );
            return { status: 'processed', referenceId: intent.referenceId, transactionId: providerTransactionId, resultStatus: 'FAILED' };
        }

        if (intent.type === 'WITHDRAW' && (isApproved || event.includes('sent') || event.includes('transferred'))) {
            await this.transactionModel.updateOne(
                { _id: intent._id, status: 'PENDING' },
                { $set: { status: 'SUCCESS', verifiedAt: new Date(), adminNote: 'Payout completed via webhook' } },
            );
            return { status: 'processed', referenceId: intent.referenceId, resultStatus: 'SUCCESS' };
        }

        if (intent.type === 'WITHDRAW' && isFailure) {
            // Refund the user if the payout failed
            const doc = await this.transactionModel.findOneAndUpdate(
                { _id: intent._id, status: 'PENDING' },
                { $set: { status: 'FAILED', verifiedAt: new Date(), adminNote: `Payout failed: ${event}` } },
                { new: false },
            );
            if (doc) {
                await this.userModel.findByIdAndUpdate(intent.userId, { $inc: { balance: intent.amount } });
                this.logger.log(`Refunded failed FedaPay withdrawal user=${intent.userId} amount=${intent.amount}`);
            }
            return { status: 'processed', referenceId: intent.referenceId, resultStatus: 'FAILED' };
        }

        return { status: 'ignored', reason: 'unsupported_event', event, providerReference, providerTransactionId };
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
                method: 'FEDAPAY',
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

        const expectedCurrency = this.getCurrency();

        // 1. Atomic balance deduction
        let updatedUser;
        try {
            updatedUser = await this.userModel.findOneAndUpdate(
                { _id: userId, balance: { $gte: normalizedAmount } },
                { $inc: { balance: -normalizedAmount } },
                { new: true },
            );

            if (!updatedUser) {
                const userExists = await this.userModel.exists({ _id: userId });
                if (!userExists) {
                    throw new NotFoundException('User not found');
                }
                throw new BadRequestException('Insufficient balance');
            }
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Balance deduction failed user=${userId}: ${error.message}`);
            throw new InternalServerErrorException('Failed to deduct balance');
        }

        // 2. Create local transaction record
        let newTx;
        try {
            newTx = new this.transactionModel({
                userId,
                userName: `${updatedUser.firstName} ${updatedUser.lastName}`.trim() || 'Unknown',
                type: 'WITHDRAW',
                amount: normalizedAmount,
                status: 'PENDING',
                method: 'FEDAPAY',
                accountNumber: normalizedPhoneNumber,
                referenceId,
                currency: expectedCurrency,
                adminNote: 'Withdrawal requested',
                timestamp: new Date(),
            });
            await newTx.save();
        } catch (txError) {
            this.logger.error(`CRITICAL: Withdrawal tx creation failed after deduction user=${userId}. Refunding. Error: ${txError.message}`);
            await this.userModel.findByIdAndUpdate(userId, { $inc: { balance: normalizedAmount } });
            throw new InternalServerErrorException('Failed to create withdrawal record. Balance refunded.');
        }

        // 3. Dispatch payout with FedaPay (best-effort; webhook/manual reconciliation finalizes)
        try {
            const payout = await this.createFedapayPayout({
                amount: normalizedAmount,
                currency: expectedCurrency,
                phoneNumber: normalizedPhoneNumber,
                firstName: updatedUser.firstName || 'User',
                lastName: updatedUser.lastName || 'Unknown',
                email: updatedUser.email || `${userId}@nomail.local`,
                referenceId,
            });
            newTx.providerTransactionId = String(payout.id);
            await newTx.save();
            this.logger.log(`FedaPay payout dispatched user=${userId} ref=${referenceId} payoutId=${payout.id}`);
        } catch (err) {
            this.logger.error(`FedaPay payout dispatch failed user=${userId} ref=${referenceId}: ${err.message}`);
            // Keep transaction PENDING for admin review; balance already deducted.
            newTx.adminNote = `Payout dispatch error: ${err.message}. Awaiting admin review.`;
            await newTx.save();
        }

        this.logger.log(`Withdrawal request created user=${userId} ref=${referenceId} amount=${normalizedAmount}`);

        return {
            status: 'success',
            message: 'Withdrawal request submitted',
            referenceId,
            newBalance: Number(updatedUser.balance) || 0,
            user: this.toUserResponse(updatedUser),
            transaction: this.toTransactionResponse(newTx),
        };
    }

    // ---------- FedaPay HTTP helpers ----------

    private async createFedapayTransaction(params: {
        amount: number;
        currency: string;
        description: string;
        referenceId: string;
        customer: {
            firstname: string;
            lastname: string;
            email: string;
            phoneNumber?: string | null;
        };
    }): Promise<{ id: string | number; reference?: string; status?: string }> {
        const body: Record<string, any> = {
            description: params.description,
            amount: params.amount,
            currency: { iso: params.currency },
            custom_metadata: { referenceId: params.referenceId },
            customer: {
                firstname: params.customer.firstname,
                lastname: params.customer.lastname,
                email: params.customer.email,
            },
        };

        if (params.customer.phoneNumber) {
            body.customer.phone_number = {
                number: params.customer.phoneNumber,
                country: 'bj',
            };
        }

        const callbackUrl = this.configService.get<string>('FEDAPAY_CALLBACK_URL');
        if (callbackUrl) {
            const separator = callbackUrl.includes('?') ? '&' : '?';
            body.callback_url = `${callbackUrl}${separator}referenceId=${encodeURIComponent(params.referenceId)}`;
        }

        const response = await this.fedapayRequest('POST', '/v1/transactions', body);
        const tx = response?.['v1/transaction'] || response?.transaction || response;
        if (!tx?.id) {
            throw new InternalServerErrorException('FedaPay did not return transaction id');
        }
        return tx;
    }

    private async generateCheckoutToken(fedapayTransactionId: string | number): Promise<{ token: string; url: string }> {
        const response = await this.fedapayRequest('POST', `/v1/transactions/${fedapayTransactionId}/token`, {});
        const token = response?.token;
        const url = response?.url;
        if (!token || !url) {
            throw new InternalServerErrorException('FedaPay did not return checkout token/url');
        }
        return { token, url };
    }

    private async fetchFedapayTransaction(fedapayTransactionId: string | number): Promise<ProviderPayload> {
        try {
            const response = await this.fedapayRequest('GET', `/v1/transactions/${fedapayTransactionId}`);
            return response?.['v1/transaction'] || response?.transaction || response;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            this.logger.error(`FedaPay fetch tx=${fedapayTransactionId} failed: ${message}`);
            if (error.response?.status === 404) {
                throw new BadRequestException('Transaction not found at FedaPay');
            }
            throw new InternalServerErrorException('Failed to verify transaction with FedaPay');
        }
    }

    private async createFedapayPayout(params: {
        amount: number;
        currency: string;
        phoneNumber: string;
        firstName: string;
        lastName: string;
        email: string;
        referenceId: string;
    }): Promise<{ id: string | number }> {
        const mode = this.detectMobileMoneyMode(params.phoneNumber);

        const body: Record<string, any> = {
            amount: params.amount,
            currency: { iso: params.currency },
            mode,
            custom_metadata: { referenceId: params.referenceId },
            customer: {
                firstname: params.firstName,
                lastname: params.lastName,
                email: params.email,
                phone_number: {
                    number: params.phoneNumber,
                    country: 'bj',
                },
            },
        };

        const createResponse = await this.fedapayRequest('POST', '/v1/payouts', body);
        const payout = createResponse?.['v1/payout'] || createResponse?.payout || createResponse;
        if (!payout?.id) {
            throw new InternalServerErrorException('FedaPay did not return payout id');
        }

        // Auto-start the payout (disabled by env flag for manual approval workflows)
        const autoStart = this.configService.get<string>('FEDAPAY_PAYOUT_AUTOSTART') !== 'false';
        if (autoStart) {
            await this.fedapayRequest('PUT', '/v1/payouts/start', {
                payouts: [{ id: payout.id }],
            });
        }

        return payout;
    }

    private async fedapayRequest(method: 'GET' | 'POST' | 'PUT', path: string, body?: Record<string, any>): Promise<any> {
        const secretKey = this.configService.get<string>('FEDAPAY_SECRET_KEY');
        if (!secretKey) {
            this.logger.error('FEDAPAY_SECRET_KEY is not configured');
            throw new InternalServerErrorException('Payment provider is not configured');
        }

        const baseUrl = this.isSandbox() ? this.sandboxBaseUrl : this.liveBaseUrl;
        const url = `${baseUrl}${path}`;

        try {
            const response = await axios.request({
                method,
                url,
                data: body,
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            });
            return response.data;
        } catch (error) {
            const providerMessage = error.response?.data?.message
                || error.response?.data?.errors
                || error.response?.statusText
                || error.message;
            this.logger.error(`FedaPay ${method} ${path} failed: ${JSON.stringify(providerMessage)}`);
            throw error;
        }
    }

    // ---------- Webhook signature ----------

    private verifyWebhookSignature(rawBody: string, header?: string) {
        const secret = (this.configService.get<string>('FEDAPAY_WEBHOOK_SECRET') || '').trim();
        if (!secret) {
            this.logger.error('FEDAPAY_WEBHOOK_SECRET is not configured');
            throw new InternalServerErrorException('Webhook verification is not configured');
        }

        const normalized = (header || '').trim();
        if (!normalized) {
            throw new UnauthorizedException('Missing webhook signature');
        }

        // FedaPay signature header format: t=timestamp,s=signature
        const parts = normalized.split(',').map((p) => p.trim());
        const timestampPart = parts.find((p) => p.startsWith('t='))?.slice(2);
        const signaturePart = parts.find((p) => p.startsWith('s='))?.slice(2);

        if (!timestampPart || !signaturePart) {
            throw new UnauthorizedException('Malformed webhook signature');
        }

        const signedPayload = `${timestampPart}.${rawBody}`;
        const expectedHex = createHmac('sha256', secret).update(signedPayload).digest('hex');

        const incoming = Buffer.from(signaturePart, 'hex');
        const expected = Buffer.from(expectedHex, 'hex');
        if (incoming.length !== expected.length || !timingSafeEqual(incoming, expected)) {
            throw new UnauthorizedException('Invalid webhook signature');
        }
    }

    // ---------- Small helpers ----------

    private getCurrency(): string {
        return (this.configService.get<string>('FEDAPAY_CURRENCY') || 'XOF').toUpperCase();
    }

    private isSandbox(): boolean {
        return this.configService.get<string>('FEDAPAY_SANDBOX') === 'true';
    }

    private extractCurrency(providerData: ProviderPayload): string | null {
        const value = providerData?.currency?.iso || providerData?.currency_iso || providerData?.currency;
        if (!value) return null;
        return String(value).trim().toUpperCase();
    }

    private detectMobileMoneyMode(phoneNumber: string): string {
        const digits = phoneNumber.replace(/^\+?(229)?/, '').replace(/\D/g, '');
        const prefix = digits.slice(0, 2);
        // Benin mobile money prefixes (best-effort; FedaPay routes if wrong)
        const mtnPrefixes = ['66', '67', '69', '90', '91', '96', '97'];
        const moovPrefixes = ['60', '61', '62', '63', '64', '65', '68', '94', '95', '98', '99'];
        if (mtnPrefixes.includes(prefix)) return 'mtn';
        if (moovPrefixes.includes(prefix)) return 'moov';
        return 'mtn';
    }

    private createReferenceId(userId: string): string {
        return `FDP_${Date.now()}_${userId.slice(-6)}_${uuidv4().slice(0, 8)}`;
    }

    private createWithdrawalReferenceId(userId: string): string {
        return `FDO_${Date.now()}_${userId.slice(-6)}_${uuidv4().slice(0, 8)}`;
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
        if (!normalized) return null;
        if (!/^[A-Za-z0-9_-]{8,128}$/.test(normalized)) {
            throw new BadRequestException('Invalid requestId format');
        }
        return normalized;
    }

    private async markIntentFailed(id: any, providerTransactionId: string, note: string) {
        await this.transactionModel.updateOne(
            { _id: id },
            {
                $set: {
                    status: 'FAILED',
                    providerTransactionId,
                    adminNote: note,
                },
            },
        );
    }

    private async findUserById(userId: string): Promise<User | null> {
        return this.userModel.findById(userId).exec();
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
}
