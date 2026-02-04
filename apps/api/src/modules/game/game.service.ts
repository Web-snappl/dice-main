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
        const sortedList = _.sortBy(newUserList, 'rollDiceResult')
        sortedList[0].winner = true
        return sortedList
    }

    async rollDice(userList: UserList) {
        if (!userList) throw new BadRequestException({ message: 'user list is undefined' })
        if (!userList.length) throw new BadRequestException({ message: 'user list length is 0' })
        if (userList.length < 2) throw new BadRequestException({ message: 'user list length is less than 2' })
        let winList: UserList = []

        if (userList.length === 2) {
            winList = this.rollDiceForEachUser(userList)
            const against = userList.filter((i) => i.uid !== winList[0].uid)[0]
            winList[0].winsAgainst = [against.uid]

            // Process Transaction for 2 players
            await this.processGameTransactions(winList);

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

            userList.forEach((originalItem, index) => {
                originalItem.winsAgainst = []
                if (originalItem.uid === winnerUid && index > 0) {
                    originalItem.winsAgainst.push(userList[index - 1].uid)
                }

                if (originalItem.uid === winnerUid && index <= userList.length - 1) {
                    originalItem.winsAgainst.push(userList[index + 1].uid)
                }
            })

            // Process Transaction for multiple players
            await this.processGameTransactions(userList);

            await this.addToHistory(userList)
            return userList
        }
        return userList

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

    async processGameTransactions(userList: UserList) {
        // Calculate total pot from all bets
        const totalPot = userList.reduce((sum, u) => sum + (u.betAmount || 0), 0);
        const commissionRate = 0.05; // 5% commission
        const winnerPayout = totalPot * (1 - commissionRate);

        console.log(`[GameService] Total Pot: ${totalPot}, Commission: ${totalPot * commissionRate}, Winner Payout: ${winnerPayout}`);

        for (const user of userList) {
            // Skip bot opponents (non-MongoDB IDs)
            const isBot = !user.uid || user.uid.startsWith('opponent_') || user.uid === 'dealer-bot';
            if (isBot) {
                console.log(`[GameService] Skipping bot user: ${user.uid}`);
                continue;
            }

            // Skip if no valid bet
            if (!user.betAmount || user.betAmount <= 0) {
                console.log(`[GameService] Skipping user ${user.uid}: no betAmount`);
                continue;
            }

            const isWinner = user.winner === true;
            let balanceChange: number;

            if (isWinner) {
                // Winner gets the pot minus commission, minus their original bet (net gain)
                balanceChange = winnerPayout - user.betAmount;
                console.log(`[GameService] Winner ${user.uid}: bet ${user.betAmount}, payout ${winnerPayout}, net change: ${balanceChange}`);
            } else {
                // Loser loses their bet
                balanceChange = -user.betAmount;
                console.log(`[GameService] Loser ${user.uid}: lost bet ${user.betAmount}`);
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
        const config = await this.gameConfigModel.findOneAndUpdate(
            { gameId },
            { $set: data },
            { new: true }
        ).exec();
        if (!config) {
            throw new BadRequestException(`Game config not found: ${gameId}`);
        }
        console.log(`[GameService] Updated config for ${gameId}:`, data);
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
                payoutMultiplier: 2,
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
}
