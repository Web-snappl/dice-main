/* eslint-disable prefer-const */
// auth.service.ts
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { LiveUser } from './liveUser.mongoSchema'
import { User } from '../auth/auth.mongoSchema';
import { GuessGameUserList, UserList, UserResponse } from './createUser.dto';
import { getRandomInt } from 'src/common/random'
import * as _ from "lodash";
import { GameHistoryModel } from 'src/common/gameHistory.mongoSchema';
import { GameConfig, GameConfigDocument } from './game-config.mongoSchema';

@Injectable()
export class GameService {
    constructor(
        @InjectModel(LiveUser.name) private readonly userModel: Model<LiveUser>,
        @InjectModel('users') private readonly persistentUserModel: Model<User>,
        @InjectModel(GameHistoryModel.name) private readonly gameHistoryModel: Model<GameHistoryModel>,
        @InjectModel(GameConfig.name) private readonly gameConfigModel: Model<GameConfigDocument>,
    ) { }

    async queryLiveUsers(): Promise<UserResponse> {
        const users = await this.userModel.find().limit(5)
        console.log('online users count: ', users.length)
        console.log('online users: ', users)
        if (users.length >= 1) {
            return { onlineUsers: users }
        } else {
            return { onlineUsers: [] }
        }
    }

    async addToHistory(list: any) {
        const mono = list.filter((i) => i.winner === true)
        const winner = mono[0] as any
        if (!winner) {
            console.warn('[GameService] addToHistory skipped: no winner in payload');
            return;
        }

        // Suspicious Detection Logic
        if (winner.rollDiceResult < 2 || winner.rollDiceResult > 12) {
            winner.isFlagged = true;
            winner.flagReason = 'Impossible Dice Value (2-12)';
        }

        // Basic check for missing opponent data
        if (!winner.winsAgainst && list.length > 1) {
            winner.isFlagged = true;
            winner.flagReason = 'Missing opponent data';
        }

        console.log('winner: ', winner);
        const gameModel = new this.gameHistoryModel(winner)
        await gameModel.save()
    }

    rollDiceForEachUser(userList: UserList): UserList {
        const newUserList = userList.map((user: any) => {
            const dice1 = getRandomInt(1, 6)
            const dice2 = getRandomInt(1, 6)
            user.rollDiceResult = dice1 + dice2
            user.dice1 = dice1
            user.dice2 = dice2
            return user
        })
        const sortedList = _.orderBy(newUserList, ['rollDiceResult'], ['desc'])

        // Detect Draw: If top 2 players have same score
        if (sortedList.length > 1 && sortedList[0].rollDiceResult === sortedList[1].rollDiceResult) {
            console.log('[GameService] Draw detected! Top two players have same score.');
            // Mark the tied players as draws? Or just don't pick a winner.
            // For Dice Duel (2 players usually), both are draws.
            // If multiplayer (3+), only top n tied are draws?
            // "Casino Dice" context implies 1v1 usually or 1vHouse.
            // Let's mark ALL tied top scorers as isDraw.
            const topScore = sortedList[0].rollDiceResult;
            sortedList.forEach(u => {
                if (u.rollDiceResult === topScore) {
                    u.isDraw = true;
                    u.winner = false; // Ensure not winner
                }
            });
        } else {
            sortedList[0].winner = true
        }

        return sortedList
    }

    async rollDice(userList: UserList) {
        if (!userList) throw new BadRequestException({ message: 'user list is undefined' })
        if (!userList.length) throw new BadRequestException({ message: 'user list length is 0' })
        if (userList.length < 2) throw new BadRequestException({ message: 'user list length is less than 2' })
        const gameId = this.resolveGameId(userList as any[]);
        const config = await this.getValidatedGameConfig(gameId, userList as any[]);

        // Route to specialized handler for Dice Table
        if (gameId === 'dice_table') {
            return this.handleDiceTable(userList, config, gameId);
        }

        let winList: UserList = []

        if (userList.length === 2) {
            winList = this.rollDiceForEachUser(userList)
            const against = userList.filter((i) => i.uid !== winList[0].uid)[0]
            winList[0].winsAgainst = [against.uid]

            // Process Transaction for 2 players
            await this.processGameTransactions(winList, config, gameId);

            await this.addToHistory(userList)
            return winList
        }

        if (userList.length >= 2) {
            winList = this.rollDiceForEachUser(userList)
            const winnerUid = winList[0]?.uid

            userList = userList.map((user) => {
                if (user.uid === winnerUid) user.winner = true
                return user
            })

            const winner = userList.find((u) => u.uid === winnerUid);
            if (winner) {
                winner.winsAgainst = userList
                    .filter((u) => u.uid !== winnerUid)
                    .map((u) => u.uid);
            }

            // Process Transaction for multiple players
            await this.processGameTransactions(userList, config, gameId);

            await this.addToHistory(userList)
            return userList
        }
        return userList

    }

    async handleDiceTable(userList: UserList, config: GameConfig, gameId: string) {
        const diceResult = getRandomInt(1, 6);
        const commissionPercent = this.normalizeCommissionPercent(config.commissionRate);
        const commissionRate = commissionPercent / 100;
        const payoutMultiplier = this.normalizePositiveNumber(config.payoutMultiplier, 5);

        for (const user of userList) {
            if (this.isBotUser(user)) {
                // Bots just need the result
                user.rollDiceResult = diceResult;
                user.dice1 = diceResult;
                continue;
            }

            const totalBet = Number(user.betAmount || 0);
            if (!Number.isFinite(totalBet) || totalBet <= 0) {
                continue; // Skip invalid bets
            }

            const bets = user.bets || {};
            let isWinner = false;
            let winnings = 0;

            // RULE: If result is 1, House Wins. Payout is 0.
            if (diceResult !== 1) {
                const winningBet = Number(bets[diceResult.toString()] || 0);
                if (winningBet > 0) {
                    isWinner = true;
                    // Formula: Gross Win including stake return
                    const grossWin = winningBet * payoutMultiplier;
                    const fee = grossWin * commissionRate;
                    winnings = grossWin - fee;
                }
            }

            // LOGIC: Deduct total bet, add winnings (if any)
            // If Loss: Change = 0 - 100 = -100
            // If Win: Change = (500 - 25) - 100 = 375
            // Net result: OldBalance - Bet + Winnings
            const balanceChange = winnings - totalBet;

            try {
                const result = await this.persistentUserModel.findByIdAndUpdate(
                    user.uid,
                    { $inc: { balance: balanceChange } },
                    { new: true }
                );

                console.log(
                    `[DiceTable] User ${user.uid}: Rolled ${diceResult}. Bet on target: ${bets[diceResult.toString()] ?? 0}. Result: ${isWinner ? 'WIN' : 'LOSS'}. Net Change: ${balanceChange}. New Balance: ${result?.balance ?? 'unknown'}`,
                );

            } catch (error) {
                console.error(`[DiceTable] Failed to update balance for ${user.uid}:`, error);
            }

            // Update user object for response
            user.winner = isWinner;
            user.rollDiceResult = diceResult;
            user.dice1 = diceResult;
            user.dice2 = 0; // Not used
        }

        // Save history (generic method might need adjustment or we just assume winner=true is enough)
        // Check addToHistory logic: it filters for `winner === true`.
        // If no one wins (House wins), addToHistory might skip or warn. 
        // We should probably ensure at least one entry is flagged or just handle it.
        // For Dice Table, history is per user usually, but here invalid winners might be dropped.
        // Let's rely on standard history for now, knowing House Wins might not show as a "User Win" in history, which is technically correct.

        // Actually, let's make sure we don't crash addToHistory if no winner.
        // addToHistory: `const mono = list.filter((i) => i.winner === true); const winner = mono[0]...`
        // If house wins (1), list has no winners. `winner` is undefined. `addToHistory` returns early with warning.
        // This is acceptable for now.
        await this.addToHistory(userList);

        return userList;
    }


    preGuessRollDice(userList: GuessGameUserList) {
        if (!userList) throw new BadRequestException({ message: 'user list is undefined' })
        if (!userList.length) throw new BadRequestException({ message: 'user list length is 0' })
        if (userList.length < 2) throw new BadRequestException({ message: 'user list length is less than 2' })

        let usersWithBadInput = []
        userList.forEach((user) => {
            if (!user.guess || !user.guess.length) usersWithBadInput.push(user)
        })
        if (usersWithBadInput.length) throw new BadRequestException({
            message: [`following users have either not guessed any number or type of guess is not list of numbers: ${JSON.stringify(usersWithBadInput)}`]
        })

        const diceNum = getRandomInt(1, 6)

        userList = userList.filter((user) => user.guess.includes(diceNum))

        userList = userList.map((user) => {
            user.winner = true
            user.rollDiceResult = diceNum
            return user
        })

        return userList
    }

    async processGameTransactions(userList: UserList, config: GameConfig, gameId: string) {
        const commissionPercent = this.normalizeCommissionPercent(config.commissionRate);
        const commissionRate = commissionPercent / 100;
        const payoutMultiplier = this.normalizePositiveNumber(config.payoutMultiplier, 2);

        for (const user of userList) {
            // Skip bot opponents (non-MongoDB IDs)
            const isBot = this.isBotUser(user as any);
            if (isBot) {
                console.log(`[GameService] Skipping bot user: ${user.uid}`);
                continue;
            }

            // Skip if no valid bet
            const betAmount = Number(user.betAmount || 0);
            if (!Number.isFinite(betAmount) || betAmount <= 0) {
                console.log(`[GameService] Skipping user ${user.uid}: no betAmount`);
                continue;
            }

            const isWinner = user.winner === true;
            // Need to check isDraw if added to UserList type or just check property
            const isDraw = (user as any).isDraw === true;

            // Logic: Always deduct bet contribution first in calculation
            // Net Change = Winnings (if any) - Bet Amount
            let balanceChange = -betAmount;

            if (isWinner) {
                const grossPayout = betAmount * payoutMultiplier;
                const fee = grossPayout * commissionRate;
                const netPayout = grossPayout - fee;

                // Add payout to the negative stance
                balanceChange += netPayout;

                console.log(
                    `[GameService] Winner ${user.uid}: game=${gameId} bet=${betAmount}, payoutMultiplier=${payoutMultiplier}, commission=${commissionPercent}%, netPayout=${netPayout}, netChange=${balanceChange}`,
                );
            } else if (isDraw) {
                // Draw Logic: Refund Bet.
                // balanceChange was -betAmount. Adding betAmount makes it 0.
                balanceChange += betAmount;
                console.log(`[GameService] Draw ${user.uid}: game=${gameId}. Bet refunded. Net Change: 0`);
            } else {
                // Loser just loses bet (balanceChange = -betAmount)
                console.log(`[GameService] Loser ${user.uid}: game=${gameId}, lost bet ${betAmount}`);
            }

            try {
                const result = await this.persistentUserModel.findByIdAndUpdate(
                    user.uid,
                    { $inc: { balance: balanceChange } },
                    { new: true }
                );
                if (result) {
                    console.log(`[GameService] Updated ${user.uid} balance by ${balanceChange}. New balance: ${result.balance}`);
                } else {
                    console.log(`[GameService] User ${user.uid} not found in DB`);
                }
            } catch (error) {
                console.error(`[GameService] Failed to update balance for ${user.uid}:`, error);
            }
        }
    }

    // Game Configuration Methods
    async getGameConfigs() {
        const configs = await this.gameConfigModel.find().exec();
        return { games: configs };
    }

    async getGameConfig(gameId: string) {
        const config = await this.gameConfigModel.findOne({ gameId }).exec();
        if (!config) {
            throw new BadRequestException(`Game config not found: ${gameId}`);
        }
        return config;
    }

    async updateGameConfig(gameId: string, data: Partial<GameConfig>) {
        const normalized = this.normalizeGameConfigPatch(data);
        const config = await this.gameConfigModel.findOneAndUpdate(
            { gameId },
            { $set: normalized },
            { new: true }
        ).exec();
        if (!config) {
            throw new BadRequestException(`Game config not found: ${gameId}`);
        }
        console.log(`[GameService] Updated config for ${gameId}:`, normalized);
        return config;
    }

    async seedDefaultConfigs() {
        const defaultConfigs = [
            {
                gameId: 'dice_duel',
                name: 'Dice Duel',
                description: 'Classic 1vs1 or 1vs2 highest roll wins duel',
                isActive: true,
                commissionRate: 5,
                minBet: 50,
                maxBet: 10000,
                minPlayers: 2,
                maxPlayers: 3,
                payoutMultiplier: 2,
                dailyBetLimit: null,
                maintenanceMode: false,
                maintenanceMessage: '',
                difficulty: 'medium',
            },
            {
                gameId: 'dice_table',
                name: 'Dice Table',
                description: 'Multiplayer dice table game with multiple betting options',
                isActive: true,
                commissionRate: 5,
                minBet: 100,
                maxBet: 50000,
                minPlayers: 2,
                maxPlayers: 6,
                payoutMultiplier: 5, // Updated to 5x per user request
                dailyBetLimit: null,
                maintenanceMode: false,
                maintenanceMessage: '',
                difficulty: 'hard',
            },
        ];

        for (const config of defaultConfigs) {
            await this.gameConfigModel.findOneAndUpdate(
                { gameId: config.gameId },
                { $setOnInsert: config },
                { upsert: true, new: true }
            ).exec();
        }

        console.log('[GameService] Seeded default game configs');
        return { message: 'Default configs seeded', count: defaultConfigs.length };
    }

    private resolveGameId(userList: any[]): string {
        const explicitGameId = userList.find((u) => typeof u?.gameId === 'string')?.gameId?.trim();
        if (explicitGameId) {
            return explicitGameId;
        }
        if (userList.some((u) => u?.uid === 'dealer-bot')) {
            return 'dice_table';
        }
        return 'dice_duel';
    }

    private async getValidatedGameConfig(gameId: string, userList: any[]): Promise<GameConfigDocument> {
        let config = await this.gameConfigModel.findOne({ gameId }).exec();
        if (!config) {
            await this.seedDefaultConfigs();
            config = await this.gameConfigModel.findOne({ gameId }).exec();
        }
        if (!config) {
            throw new BadRequestException(`Game config not found: ${gameId}`);
        }

        if (!config.isActive) {
            throw new BadRequestException(`Game "${config.name}" is currently disabled`);
        }
        if (config.maintenanceMode) {
            throw new BadRequestException(config.maintenanceMessage || `${config.name} is in maintenance mode`);
        }

        const minPlayers = this.normalizePositiveNumber(config.minPlayers, 2);
        const maxPlayers = this.normalizePositiveNumber(config.maxPlayers, minPlayers);
        if (userList.length < minPlayers || userList.length > maxPlayers) {
            throw new BadRequestException(
                `Invalid player count for ${config.name}. Required: ${minPlayers}-${maxPlayers}, got: ${userList.length}`,
            );
        }

        const minBet = this.normalizePositiveNumber(config.minBet, 1);
        const maxBet = this.normalizePositiveNumber(config.maxBet, minBet);
        const dailyBetLimit = config.dailyBetLimit == null
            ? null
            : this.normalizePositiveNumber(config.dailyBetLimit, 0);

        for (const user of userList) {
            if (this.isBotUser(user)) {
                continue;
            }

            const betAmount = Number(user.betAmount || 0);
            if (!Number.isFinite(betAmount) || betAmount <= 0) {
                throw new BadRequestException(`Invalid bet amount for user ${user.uid}`);
            }
            if (betAmount < minBet) {
                throw new BadRequestException(`Minimum bet for ${config.name} is ${minBet}`);
            }
            if (betAmount > maxBet) {
                throw new BadRequestException(`Maximum bet for ${config.name} is ${maxBet}`);
            }
            if (dailyBetLimit != null && betAmount > dailyBetLimit) {
                throw new BadRequestException(`Daily limit exceeded for ${config.name}. Limit: ${dailyBetLimit}`);
            }
        }

        return config;
    }

    private isBotUser(user: any): boolean {
        return !user?.uid || user.uid.startsWith('opponent_') || user.uid === 'dealer-bot';
    }

    private normalizeCommissionPercent(value: number): number {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0) {
            return 0;
        }
        if (numeric > 95) {
            return 95;
        }
        return numeric;
    }

    private normalizePositiveNumber(value: number, fallback: number): number {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0) {
            return fallback;
        }
        return numeric;
    }

    private normalizeGameConfigPatch(data: Partial<GameConfig>): Partial<GameConfig> {
        const patch: Record<string, any> = {};

        if (data.name !== undefined) patch.name = data.name;
        if (data.description !== undefined) patch.description = data.description;
        if (data.isActive !== undefined) patch.isActive = data.isActive;
        if (data.commissionRate !== undefined) patch.commissionRate = data.commissionRate;
        if (data.minBet !== undefined) patch.minBet = data.minBet;
        if (data.maxBet !== undefined) patch.maxBet = data.maxBet;
        if (data.minPlayers !== undefined) patch.minPlayers = data.minPlayers;
        if (data.maxPlayers !== undefined) patch.maxPlayers = data.maxPlayers;
        if (data.payoutMultiplier !== undefined) patch.payoutMultiplier = data.payoutMultiplier;
        if (data.dailyBetLimit !== undefined) patch.dailyBetLimit = data.dailyBetLimit;
        if (data.maintenanceMode !== undefined) patch.maintenanceMode = data.maintenanceMode;
        if (data.maintenanceMessage !== undefined) patch.maintenanceMessage = data.maintenanceMessage;
        if (data.difficulty !== undefined) patch.difficulty = data.difficulty;

        if (patch.commissionRate !== undefined) {
            patch.commissionRate = this.normalizeCommissionPercent(patch.commissionRate);
        }

        if (patch.minBet !== undefined) {
            patch.minBet = this.normalizePositiveNumber(patch.minBet, 1);
        }
        if (patch.maxBet !== undefined) {
            patch.maxBet = this.normalizePositiveNumber(patch.maxBet, patch.minBet ?? 1);
        }
        if (patch.minBet !== undefined && patch.maxBet !== undefined && patch.minBet > patch.maxBet) {
            throw new BadRequestException('minBet cannot be greater than maxBet');
        }

        if (patch.minPlayers !== undefined) {
            patch.minPlayers = this.normalizePositiveNumber(patch.minPlayers, 2);
        }
        if (patch.maxPlayers !== undefined) {
            patch.maxPlayers = this.normalizePositiveNumber(patch.maxPlayers, patch.minPlayers ?? 2);
        }
        if (patch.minPlayers !== undefined && patch.maxPlayers !== undefined && patch.minPlayers > patch.maxPlayers) {
            throw new BadRequestException('minPlayers cannot be greater than maxPlayers');
        }

        if (patch.payoutMultiplier !== undefined) {
            patch.payoutMultiplier = this.normalizePositiveNumber(patch.payoutMultiplier, 1);
            if (patch.payoutMultiplier <= 0) {
                throw new BadRequestException('payoutMultiplier must be greater than 0');
            }
        }

        if (patch.dailyBetLimit !== undefined && patch.dailyBetLimit !== null) {
            patch.dailyBetLimit = this.normalizePositiveNumber(patch.dailyBetLimit, 0);
            if (patch.dailyBetLimit <= 0) {
                throw new BadRequestException('dailyBetLimit must be greater than 0 or null');
            }
        }

        return patch as Partial<GameConfig>;
    }
}
