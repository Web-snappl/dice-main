// src/modules/deposits/deposits.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deposit } from '../../common/deposits.mongoSchema';
import { User } from '../auth/auth.mongoSchema';
import { GameHistoryModel } from '../../common/gameHistory.mongoSchema';
import { CreateDepositDto, DepositResponse } from './deposits.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class DepositsService {
    constructor(
        @InjectModel(Deposit.name) private readonly depositModel: Model<Deposit>,
        @InjectModel(GameHistoryModel.name) private readonly gameHistoryModel: Model<GameHistoryModel>,
        @InjectModel('users') private readonly userModel: Model<User>,
    ) { }

    async deposit(depositDto: CreateDepositDto): Promise<DepositResponse> {
        const { uid, displayName, amount, vip } = depositDto;

        // Define acceptable amounts based on VIP status
        const acceptableAmounts = vip
            ? [1000, 2000, 3000, 4000, 5000]
            : [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

        // Convert the string amount to a number for comparison
        const numericAmount = Number(amount);

        // Check if the amount is in the acceptable list
        if (!acceptableAmounts.includes(numericAmount)) {
            throw new BadRequestException({
                status: 400,
                message: `Invalid deposit amount: ${amount}. ${vip ? 'VIP users' : 'Non-VIP users'} can only deposit: ${acceptableAmounts.join(', ')}`,
            });
        }

        // Create and save the deposit record
        const newDeposit = new this.depositModel({
            uid,
            displayName,
            amount: numericAmount,
            vip,
            timestamp: new Date(),
        });

        const savedDeposit = await newDeposit.save();
        const depositId = savedDeposit._id.toString();

        // Update user balance
        await this.userModel.findOneAndUpdate(
            { uid: uid },
            { $inc: { balance: numericAmount } }
        );

        return {
            status: 201,
            message: 'Deposit successful',
            depositId,
        };
    }

    async gamePlayHistory(): Promise<any[]> {
        const gameHistories = await this.gameHistoryModel.find({});
        return gameHistories;
    }

    async depositHistory(): Promise<any[]> {
        const deposits = await this.depositModel.find();
        return deposits;
    }

    async profitability(commission: number): Promise<number> {
        const deposits = await this.depositModel.find({});
        // const winningUids = winningGameHistories.map(history => history.uid);
        // const winningDeposits = await this.depositModel.find({ uid: { $in: winningUids } });

        let totalProfit = 0;
        for (const deposit of deposits) {
            totalProfit += deposit.amount
        }

        return {
            transactions: deposits.length,
            commission: commission,
            totalProfit: totalProfit,
            depositHistory: deposits
        } as any;
    }
}