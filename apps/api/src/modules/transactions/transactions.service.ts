import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from '../../common/transactions.mongoSchema';

export interface CreateTransactionDto {
    userId: string;
    userName?: string;
    type: string;
    amount: number;
    status: string;
    method?: string;
    accountNumber?: string;
    referenceId?: string;
    adminNote?: string;
}

@Injectable()
export class TransactionsService {
    constructor(
        @InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>,
    ) { }

    async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
        const transaction = new this.transactionModel(createTransactionDto);
        return transaction.save();
    }

    async findByUser(userId: string): Promise<Transaction[]> {
        return this.transactionModel.find({ userId }).sort({ timestamp: -1 }).exec();
    }

    async findByReferenceId(referenceId: string): Promise<Transaction | null> {
        return this.transactionModel.findOne({ referenceId }).exec();
    }

    async findAll(): Promise<Transaction[]> {
        return this.transactionModel.find().sort({ timestamp: -1 }).exec();
    }
}
