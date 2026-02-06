import { Controller, Post, Body, Logger, NotFoundException } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/auth.mongoSchema';

@Controller('mtn/webhook')
export class MtnWebhookController {
    private readonly logger = new Logger(MtnWebhookController.name);

    constructor(
        private readonly transactionsService: TransactionsService,
        @InjectModel('users') private readonly userModel: Model<User>,
    ) { }

    @Post()
    async handleWebhook(@Body() payload: any) {
        this.logger.log('Received MTN Webhook:', JSON.stringify(payload));

        const { externalId, status, amount } = payload; // externalId matches our referenceId

        // 1. Find the Transaction
        // Need to implement findByReferenceId in TransactionsService or use findOne
        // Since findOne isn't exposed, I'll use find and filter, or add method.
        // For now, let's assume I can query the model directly if needed, but service is cleaner.
        // I will add findByReferenceId to TransactionsService in next step.
        // For now, assuming findByReferenceId exists or I access via mongo directly if service allows.
        // Actually, TransactionsService wraps the model. I should extend it.

        // Let's assume I will add `findByReferenceId` to TransactionsService.
        const transaction = await this.transactionsService.findByReferenceId(externalId);

        if (!transaction) {
            this.logger.warn(`Transaction not found for referenceId: ${externalId}`);
            // Return 200 to acknowledge receipt even if we can't process it (to stop retries)
            return { status: 'acknowledged' };
        }

        if (transaction.status !== 'PENDING') {
            this.logger.log(`Transaction ${externalId} already processed (Status: ${transaction.status})`);
            return { status: 'processed' };
        }

        if (status === 'SUCCESSFUL') {
            this.logger.log(`Processing SUCCESSFUL deposit for ${externalId}`);

            // Update Transaction Status
            transaction.status = 'SUCCESS';
            transaction.adminNote = (transaction.adminNote || '') + ` | MTN ID: ${payload.financialTransactionId}`;
            await transaction.save();

            // Update User Balance
            // Handle XOF/EUR conversion?
            // Sandbox uses EUR, Production XOF.
            // If payload.currency is EUR, and app uses XOF, we might have an issue.
            // But we requested 500 EUR (sandbox). User's wallet is likely XOF.
            // In Production, we request XOF, get XOF. 1:1.
            // In Sandbox, we request EUR.
            // I will assume 1:1 for now or rely on the amount requested.
            // It's safer to use transaction.amount (what we requested).

            await this.userModel.findByIdAndUpdate(
                transaction.userId,
                { $inc: { balance: transaction.amount } }
            );

            this.logger.log(`Updated balance for user ${transaction.userId} by ${transaction.amount}`);

        } else if (status === 'FAILED' || status === 'REJECTED') {
            this.logger.warn(`Processing FAILED deposit for ${externalId}`);
            transaction.status = 'FAILED';
            transaction.adminNote = (transaction.adminNote || '') + ` | Reason: ${JSON.stringify(payload.reason || 'Unknown')}`;
            await transaction.save();
        }

        return { status: 'success' };
    }
}
