// src/modules/deposits/deposits.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Deposit } from '../../common/deposits.mongoSchema';
import { GameHistoryModel } from '../../common/gameHistory.mongoSchema';
import { Withdrawal } from '../../common/withdrawals.mongoSchema';
import { CreateDepositDto, DepositResponse } from './deposits.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class DepositsService {
    constructor(
        @InjectModel(Deposit.name) private readonly depositModel: Model<Deposit>,
        @InjectModel(GameHistoryModel.name) private readonly gameHistoryModel: Model<GameHistoryModel>,
        @InjectModel(Withdrawal.name) private readonly withdrawalModel: Model<Withdrawal>,
    ) { }

    async deposit(depositDto: CreateDepositDto): Promise<DepositResponse> {
        const { uid, displayName, amount, vip } = depositDto;

        const acceptableAmounts = vip
            ? [1000, 2000, 3000, 4000, 5000]
            : [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

        const numericAmount = Number(amount);

        if (!acceptableAmounts.includes(numericAmount)) {
            throw new BadRequestException({
                status: 400,
                message: `Invalid deposit amount: ${amount}. ${vip ? 'VIP users' : 'Non-VIP users'} can only deposit: ${acceptableAmounts.join(', ')}`,
            });
        }

        const newDeposit = new this.depositModel({
            uid,
            displayName,
            amount: numericAmount,
            vip,
            timestamp: new Date(),
        });

        const savedDeposit = await newDeposit.save();
        const depositId = savedDeposit._id.toString();

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

    async profitability(commission: number): Promise<any> {
        const deposits = await this.depositModel.find({});

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

    async requestWithdrawal(withdrawalDto: any): Promise<any> {
        const newWithdrawal = new this.withdrawalModel({
            ...withdrawalDto,
            amount: Number(withdrawalDto.amount),
            status: Number(withdrawalDto.amount) >= 10000 ? 'PENDING' : 'APPROVED',
            timestamp: new Date(),
        });

        const saved = await newWithdrawal.save();
        return {
            status: 201,
            message: saved.status === 'PENDING' ? 'Withdrawal pending approval' : 'Withdrawal approved',
            withdrawalId: saved._id,
            withdrawalStatus: saved.status
        };
    }

    async updateWithdrawalStatus(updateDto: any): Promise<any> {
        const { withdrawalId, status, adminNote } = updateDto;
        const withdrawal = await this.withdrawalModel.findByIdAndUpdate(
            withdrawalId,
            { status, adminNote },
            { new: true }
        );

        if (!withdrawal) throw new BadRequestException('Withdrawal record not found');

        return {
            status: 200,
            message: `Withdrawal ${status.toLowerCase()} successfully`,
            withdrawal
        };
    }

    async getWithdrawalHistory(): Promise<any[]> {
        return await this.withdrawalModel.find().sort({ timestamp: -1 });
    }
}