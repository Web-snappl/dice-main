/* eslint-disable prefer-const */
// auth.service.ts
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { LiveUser } from './liveUser.mongoSchema'
import { GuessGameUserList, UserList, UserResponse } from './createUser.dto';
import { getRandomInt } from 'src/common/random'
import * as _ from "lodash";
import { GameHistoryModel } from 'src/common/gameHistory.mongoSchema';

@Injectable()
export class GameService {
    constructor(
        @InjectModel(LiveUser.name) private readonly userModel: Model<LiveUser>,
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
        const winner = mono[0]
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

    rollDice(userList: UserList) {
        if (!userList) throw new BadRequestException({ message: 'user list is undefined' })
        if (!userList.length) throw new BadRequestException({ message: 'user list length is 0' })
        if (userList.length < 2) throw new BadRequestException({ message: 'user list length is less than 2' })
        let winList: UserList = []

        if (userList.length === 2) {
            winList = this.rollDiceForEachUser(userList)
            const against = userList.filter((i) => i.uid !== winList[0].uid)[0]
            winList[0].winsAgainst = [against.uid]
            this.addToHistory(userList)
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
            this.addToHistory(userList)
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
}
