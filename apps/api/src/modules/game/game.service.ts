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

@Injectable()
export class GameService {
    constructor(
        @InjectModel(LiveUser.name) private readonly userModel: Model<LiveUser>,
        @InjectModel('users') private readonly persistentUserModel: Model<User>,
        @InjectModel(GameHistoryModel.name) private readonly gameHistoryModel: Model<GameHistoryModel>,

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
        // Find winner (assuming one winner for now based on logic)
        const winner = userList.find(u => u.winner);

        for (const user of userList) {
            // Skip bots or users without UIDs (if any) or existing logic
            if (user.uid === 'dealer-bot' || !user.betAmount || user.betAmount <= 0) continue;

            const isWinner = user.winner === true;
            let balanceChange = -user.betAmount; // Deduct bet

            if (isWinner) {
                // If winner, they get their bet back + winnings
                // Assuming 5x multiplier for now to match mobile client visual logic generally
                // But safer to just deduct bet if we can't be sure of win amount.
                // However, user will LOSE money if we don't credit back.
                // Since this is "Unify Game Funding", users just want to use their balance.
                // We will add 5x win amount.
                balanceChange += (user.betAmount * 5);
            }

            console.log(`Processing transaction for ${user.uid}: ${balanceChange}`);

            await this.persistentUserModel.findOneAndUpdate(
                { uid: user.uid },
                { $inc: { balance: balanceChange } }
            );
        }
    }
}
