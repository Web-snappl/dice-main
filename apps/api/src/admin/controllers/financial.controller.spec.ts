import { FinancialController } from './financial.controller';

describe('FinancialController', () => {
    let controller: FinancialController;
    let transactionModel: any;
    let userModel: any;
    let rewardModel: any;
    let session: any;

    beforeEach(() => {
        session = {
            withTransaction: jest.fn(async (cb: () => Promise<void>) => cb()),
            endSession: jest.fn().mockResolvedValue(undefined),
        };

        transactionModel = {
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
            countDocuments: jest.fn(),
            db: {
                startSession: jest.fn().mockResolvedValue(session),
            },
        };
        userModel = {
            findByIdAndUpdate: jest.fn(),
        };
        rewardModel = {};
        controller = new FinancialController(transactionModel, userModel, rewardModel);
    });

    it('returns mapped transaction history with pagination metadata', async () => {
        const txDocs = [
            {
                _id: { toString: () => 'tx_1' },
                userId: 'user_1',
                userName: 'Jane Doe',
                amount: 1200,
                type: 'DEPOSIT',
                status: 'SUCCESS',
                method: 'KKIAPAY',
                timestamp: new Date('2026-02-01T10:00:00.000Z'),
                accountNumber: '22997000000',
                referenceId: 'REF_1',
                providerTransactionId: 'KKIA_TX_1',
                currency: 'XOF',
            },
        ];

        const queryChain = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(txDocs),
        };

        transactionModel.find.mockReturnValue(queryChain);
        transactionModel.countDocuments.mockResolvedValue(1);

        const result = await controller.getTransactions({
            page: 1,
            limit: 20,
            status: undefined,
            type: undefined,
        } as any);

        expect(transactionModel.find).toHaveBeenCalledWith({});
        expect(result.total).toBe(1);
        expect(result.transactions).toHaveLength(1);
        expect(result.transactions[0]).toMatchObject({
            id: 'tx_1',
            userId: 'user_1',
            userName: 'Jane Doe',
            amount: 1200,
            type: 'DEPOSIT',
            status: 'SUCCESS',
            method: 'KKIAPAY',
            referenceId: 'REF_1',
            providerTransactionId: 'KKIA_TX_1',
            currency: 'XOF',
        });
    });

    it('approves pending withdrawal atomically and is idempotent on repeated approval', async () => {
        const approved = {
            _id: 'wd_1',
            type: 'WITHDRAW',
            status: 'SUCCESS',
        };

        transactionModel.findOneAndUpdate.mockResolvedValueOnce(approved);

        const first = await controller.approveWithdrawal('wd_1');
        expect(first.message).toBe('Withdrawal approved');
        expect(first.transaction).toBe(approved);

        transactionModel.findOneAndUpdate.mockResolvedValueOnce(null);
        transactionModel.findById.mockResolvedValueOnce({
            _id: 'wd_1',
            type: 'WITHDRAW',
            status: 'SUCCESS',
        });

        const second = await controller.approveWithdrawal('wd_1');
        expect(second.message).toBe('Withdrawal already approved');
    });

    it('rejects pending withdrawal once and refunds balance exactly once', async () => {
        const txDoc = {
            _id: 'wd_2',
            userId: 'user_9',
            type: 'WITHDRAW',
            status: 'PENDING',
            amount: 2000,
            adminNote: null,
            verifiedAt: null,
            save: jest.fn().mockResolvedValue(undefined),
        };

        transactionModel.findOne.mockReturnValueOnce({
            session: jest.fn().mockResolvedValue(txDoc),
        });
        userModel.findByIdAndUpdate.mockResolvedValueOnce({
            _id: 'user_9',
            balance: 5000,
        });

        const result = await controller.rejectWithdrawal('wd_2', 'Invalid account');
        expect(result.message).toBe('Withdrawal rejected and balance refunded');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
        expect(txDoc.status).toBe('FAILED');
        expect(txDoc.adminNote).toBe('Invalid account');
        expect(txDoc.save).toHaveBeenCalledTimes(1);

        const alreadyFailed = {
            _id: 'wd_2',
            userId: 'user_9',
            type: 'WITHDRAW',
            status: 'FAILED',
            adminNote: 'Invalid account',
        };
        transactionModel.findOne.mockReturnValueOnce({
            session: jest.fn().mockResolvedValue(alreadyFailed),
        });

        const second = await controller.rejectWithdrawal('wd_2', 'Another reason');
        expect(second.message).toBe('Withdrawal already rejected');
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    });
});
