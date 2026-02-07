import { BadRequestException } from '@nestjs/common';
import { GameService } from './game.service';

describe('GameService', () => {
    const makeService = (overrides?: {
        persistentUserModel?: any;
        gameConfigModel?: any;
    }) => {
        const userModel = { find: jest.fn() };
        const persistentUserModel = overrides?.persistentUserModel ?? {
            findByIdAndUpdate: jest.fn().mockResolvedValue({ balance: 0 }),
        };
        const gameHistoryModel = function () { return { save: jest.fn() } } as any;
        const gameConfigModel = overrides?.gameConfigModel ?? {
            findOneAndUpdate: jest.fn(() => ({ exec: jest.fn().mockResolvedValue({ gameId: 'dice_duel' }) })),
            findOne: jest.fn(() => ({ exec: jest.fn().mockResolvedValue({ gameId: 'dice_duel' }) })),
        };
        return new GameService(
            userModel as any,
            persistentUserModel as any,
            gameHistoryModel as any,
            gameConfigModel as any,
        );
    };

    it('uses configured commission rate in payout calculation (not hardcoded value)', async () => {
        const findByIdAndUpdate = jest.fn().mockResolvedValue({ balance: 1000 });
        const service = makeService({
            persistentUserModel: { findByIdAndUpdate },
        });

        const users = [
            { uid: '64b7f4be5f99f4f1b4f12345', displayName: 'Winner', betAmount: 100, winner: true },
            { uid: '64b7f4be5f99f4f1b4f67890', displayName: 'Loser', betAmount: 100, winner: false },
        ] as any;
        const config = { commissionRate: 50, payoutMultiplier: 2 } as any;

        await service.processGameTransactions(users, config, 'dice_duel');

        expect(findByIdAndUpdate).toHaveBeenCalledWith(
            '64b7f4be5f99f4f1b4f12345',
            { $inc: { balance: 0 } },
            { new: true },
        );
        expect(findByIdAndUpdate).toHaveBeenCalledWith(
            '64b7f4be5f99f4f1b4f67890',
            { $inc: { balance: -100 } },
            { new: true },
        );
    });

    it('sanitizes update patch and clamps commission', async () => {
        const exec = jest.fn().mockResolvedValue({ gameId: 'dice_duel' });
        const findOneAndUpdate = jest.fn(() => ({ exec }));
        const service = makeService({
            gameConfigModel: {
                findOneAndUpdate,
            },
        });

        await service.updateGameConfig('dice_duel', {
            _id: 'should-not-pass-through',
            gameId: 'should-not-change',
            commissionRate: 120,
            minBet: 50,
            maxBet: 1000,
        } as any);

        const firstCall = (findOneAndUpdate as jest.Mock).mock.calls[0] as any[];
        const setPatch = firstCall[1].$set as Record<string, unknown>;
        expect(setPatch.commissionRate).toBe(95);
        expect(setPatch.minBet).toBe(50);
        expect(setPatch.maxBet).toBe(1000);
        expect(setPatch._id).toBeUndefined();
        expect(setPatch.gameId).toBeUndefined();
    });

    it('rejects invalid bet range updates', async () => {
        const service = makeService();

        await expect(
            service.updateGameConfig('dice_duel', {
                minBet: 200,
                maxBet: 100,
            } as any),
        ).rejects.toThrow(BadRequestException);
    });

    it('does not throw when winner is last player in multi-player mapping', async () => {
        const service = makeService();
        jest.spyOn(service as any, 'getValidatedGameConfig').mockResolvedValue({
            gameId: 'dice_duel',
            name: 'Dice Duel',
            isActive: true,
            maintenanceMode: false,
            minPlayers: 2,
            maxPlayers: 3,
            minBet: 1,
            maxBet: 10000,
            commissionRate: 5,
            payoutMultiplier: 2,
            dailyBetLimit: null,
        });
        jest.spyOn(service, 'rollDiceForEachUser').mockReturnValue([
            { uid: 'opponent_2', displayName: 'Opponent 2', betAmount: 100, winner: true },
            { uid: 'user_1', displayName: 'User 1', betAmount: 100, winner: false },
            { uid: 'opponent_1', displayName: 'Opponent 1', betAmount: 100, winner: false },
        ] as any);
        jest.spyOn(service, 'processGameTransactions').mockResolvedValue(undefined);
        jest.spyOn(service, 'addToHistory').mockResolvedValue(undefined);

        const result = await service.rollDice([
            { uid: 'user_1', displayName: 'User 1', betAmount: 100 },
            { uid: 'opponent_1', displayName: 'Opponent 1', betAmount: 100 },
            { uid: 'opponent_2', displayName: 'Opponent 2', betAmount: 100 },
        ] as any);

        const winner = result.find((u: any) => u.winner === true);
        expect(winner?.uid).toBe('opponent_2');
        expect(winner?.winsAgainst).toEqual(expect.arrayContaining(['user_1', 'opponent_1']));
    });
});
