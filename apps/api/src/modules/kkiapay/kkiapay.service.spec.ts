import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { KkiapayService } from './kkiapay.service';

jest.mock('axios');
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid'),
}));

describe('KkiapayService', () => {
    const mockedAxios = axios as jest.Mocked<typeof axios>;

    let service: KkiapayService;
    let configService: { get: jest.Mock };
    let userModel: any;
    let transactionModel: any;
    let session: any;

    beforeEach(() => {
        session = {
            withTransaction: jest.fn(async (cb: () => Promise<void>) => cb()),
            endSession: jest.fn().mockResolvedValue(undefined),
        };

        configService = {
            get: jest.fn((key: string) => {
                const values: Record<string, string> = {
                    KKIAPAY_PRIVATE_KEY: 'private_test_key',
                    KKIAPAY_SANDBOX: 'true',
                    KKIAPAY_CURRENCY: 'XOF',
                    KKIAPAY_WEBHOOK_SECRET: 'webhook_test_secret',
                };
                return values[key];
            }),
        };

        userModel = {
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findOneAndUpdate: jest.fn(),
        };

        transactionModel = jest.fn();
        transactionModel.mockImplementation((payload: any) => ({
            ...payload,
            save: jest.fn().mockResolvedValue(undefined),
        }));
        transactionModel.findOne = jest.fn();
        transactionModel.updateOne = jest.fn().mockResolvedValue({ acknowledged: true });
        transactionModel.findById = jest.fn();
        transactionModel.db = {
            startSession: jest.fn().mockResolvedValue(session),
        };

        service = new KkiapayService(configService as any, userModel as any, transactionModel as any);
        jest.clearAllMocks();
    });

    it('credits balance and transitions deposit to SUCCESS after provider verification', async () => {
        const intent = {
            _id: 'tx_1',
            userId: 'user_1',
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            referenceId: 'REF_1',
            amount: 1500,
            status: 'PENDING',
            providerTransactionId: null,
        };
        const txDoc = {
            ...intent,
            save: jest.fn().mockResolvedValue(undefined),
        };
        const updatedUser = {
            _id: 'user_1',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phoneNumber: '22997000000',
            role: 'user',
            status: 'active',
            balance: 3200,
        };

        transactionModel.findOne
            .mockResolvedValueOnce(intent) // intent lookup
            .mockResolvedValueOnce(null) // duplicate SUCCESS check outside tx
            .mockReturnValueOnce({
                session: jest.fn().mockResolvedValue(txDoc), // tx lookup inside transaction
            })
            .mockReturnValueOnce({
                session: jest.fn().mockResolvedValue(null), // duplicate SUCCESS check inside transaction
            });

        userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);
        mockedAxios.get.mockResolvedValue({
            data: {
                status: 'SUCCESS',
                amount: 1500,
                currency: 'XOF',
                metadata: { referenceId: 'REF_1' },
            },
        } as any);

        const result = await service.processDeposit('user_1', 'KKIA_TX_1', 'REF_1');

        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'user_1',
            { $inc: { balance: 1500 } },
            { new: true, session },
        );
        expect(txDoc.status).toBe('SUCCESS');
        expect(txDoc.providerTransactionId).toBe('KKIA_TX_1');
        expect(txDoc.save).toHaveBeenCalled();
        expect(result.status).toBe('success');
        expect(result.user.wallet.balance).toBe(3200);
    });

    it('is idempotent when deposit intent is already SUCCESS', async () => {
        const intent = {
            _id: 'tx_1',
            userId: 'user_1',
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            referenceId: 'REF_1',
            amount: 1000,
            status: 'SUCCESS',
            providerTransactionId: 'KKIA_TX_1',
        };
        const existingUser = {
            _id: 'user_1',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phoneNumber: '22997000000',
            role: 'user',
            status: 'active',
            balance: 5000,
        };

        transactionModel.findOne.mockResolvedValue(intent);
        userModel.findById.mockResolvedValue(existingUser);

        const result = await service.processDeposit('user_1', 'KKIA_TX_1', 'REF_1');

        expect(mockedAxios.get).not.toHaveBeenCalled();
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(result.message).toBe('Deposit already processed');
        expect(result.user.wallet.balance).toBe(5000);
    });

    it('rejects verification when provider amount mismatches intent amount', async () => {
        const intent = {
            _id: 'tx_1',
            userId: 'user_1',
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            referenceId: 'REF_1',
            amount: 1000,
            status: 'PENDING',
            providerTransactionId: null,
        };

        transactionModel.findOne.mockResolvedValueOnce(intent);
        mockedAxios.get.mockResolvedValue({
            data: {
                status: 'SUCCESS',
                amount: 2000,
                currency: 'XOF',
                metadata: { referenceId: 'REF_1' },
            },
        } as any);

        await expect(service.processDeposit('user_1', 'KKIA_TX_1', 'REF_1')).rejects.toBeInstanceOf(BadRequestException);
        expect(transactionModel.updateOne).toHaveBeenCalled();
    });

    it('prevents double-credit when provider transaction id is already marked SUCCESS', async () => {
        const intent = {
            _id: 'tx_1',
            userId: 'user_1',
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            referenceId: 'REF_1',
            amount: 1000,
            status: 'PENDING',
            providerTransactionId: null,
        };
        const duplicateSuccess = {
            _id: 'tx_other',
            userId: 'user_2',
            status: 'SUCCESS',
            providerTransactionId: 'KKIA_TX_1',
        };

        transactionModel.findOne
            .mockResolvedValueOnce(intent)
            .mockResolvedValueOnce(duplicateSuccess);
        mockedAxios.get.mockResolvedValue({
            data: {
                status: 'SUCCESS',
                amount: 1000,
                currency: 'XOF',
                metadata: { referenceId: 'REF_1' },
            },
        } as any);

        await expect(service.processDeposit('user_1', 'KKIA_TX_1', 'REF_1')).rejects.toBeInstanceOf(ConflictException);
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('fails closed when provider reference is missing and strict matching is enabled', async () => {
        const intent = {
            _id: 'tx_1',
            userId: 'user_1',
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            referenceId: 'REF_1',
            amount: 1000,
            status: 'PENDING',
            providerTransactionId: null,
            currency: 'XOF',
        };

        transactionModel.findOne
            .mockResolvedValueOnce(intent)
            .mockResolvedValueOnce(null);
        mockedAxios.get.mockResolvedValue({
            data: {
                status: 'SUCCESS',
                amount: 1000,
                currency: 'XOF',
            },
        } as any);

        await expect(service.processDeposit('user_1', 'KKIA_TX_1', 'REF_1')).rejects.toBeInstanceOf(BadRequestException);
        expect(transactionModel.updateOne).toHaveBeenCalled();
    });

    it('treats duplicate withdrawal submission with same requestId as idempotent', async () => {
        const existingWithdrawal = {
            _id: 'wd_1',
            userId: 'user_1',
            userName: 'Jane Doe',
            type: 'WITHDRAW',
            amount: 1000,
            status: 'PENDING',
            method: 'KKIAPAY',
            accountNumber: '22997000000',
            referenceId: 'WREQ_retry_1234',
            timestamp: new Date('2026-02-01T10:00:00.000Z'),
        };
        const user = {
            _id: 'user_1',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phoneNumber: '22997000000',
            role: 'user',
            status: 'active',
            balance: 4000,
        };

        transactionModel.findOne.mockResolvedValue(existingWithdrawal);
        userModel.findById.mockResolvedValue(user);

        const result = await service.requestWithdrawal('user_1', 1000, '22997000000', 'retry_1234');

        expect(result.idempotent).toBe(true);
        expect(result.message).toBe('Withdrawal request already submitted');
        expect(userModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('creates withdrawal in a transaction and debits balance once', async () => {
        const save = jest.fn().mockResolvedValue(undefined);
        transactionModel.mockImplementation((payload: any) => ({
            ...payload,
            _id: 'wd_2',
            save,
        }));

        transactionModel.findOne.mockResolvedValueOnce(null);
        userModel.findOneAndUpdate.mockResolvedValue({
            _id: 'user_1',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            phoneNumber: '22997000000',
            role: 'user',
            status: 'active',
            balance: 3000,
        });

        const result = await service.requestWithdrawal('user_1', 2000, '22997000000', 'retry_5678');

        expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: 'user_1', balance: { $gte: 2000 } },
            { $inc: { balance: -2000 } },
            { new: true, session },
        );
        expect(save).toHaveBeenCalledWith({ session });
        expect(result.status).toBe('success');
        expect(result.transaction.type).toBe('WITHDRAW');
        expect(result.transaction.status).toBe('PENDING');
    });

    it('rejects webhook when signature is invalid', async () => {
        await expect(
            service.handleWebhook(
                { event: 'transaction.success', transactionId: 'KKIA_TX_1', isPaymentSucces: true },
                'invalid_secret',
            ),
        ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('processes valid success webhook through server-side verification flow', async () => {
        const intent = {
            _id: 'tx_1',
            userId: 'user_1',
            type: 'DEPOSIT',
            method: 'KKIAPAY',
            referenceId: 'REF_1',
        };
        transactionModel.findOne.mockReturnValueOnce({
            exec: jest.fn().mockResolvedValue(intent),
        });

        const processSpy = jest.spyOn(service, 'processDeposit').mockResolvedValue({
            status: 'success',
        } as any);

        const result = await service.handleWebhook(
            {
                event: 'transaction.success',
                isPaymentSucces: true,
                transactionId: 'KKIA_TX_1',
                metadata: { referenceId: 'REF_1' },
            },
            'webhook_test_secret',
        );

        expect(processSpy).toHaveBeenCalledWith('user_1', 'KKIA_TX_1', 'REF_1');
        expect(result).toMatchObject({
            status: 'processed',
            referenceId: 'REF_1',
            transactionId: 'KKIA_TX_1',
        });
    });
});
