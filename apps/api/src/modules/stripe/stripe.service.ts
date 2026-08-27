import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { Connection, Model } from 'mongoose';
import Stripe from 'stripe';
import { Transaction } from '../../common/transactions.mongoSchema';
import { User } from '../auth/auth.mongoSchema';
import { StripeClientService } from './stripe-client.service';

const STRIPE_CURRENCY = 'xof';
const MIN_STRIPE_DEPOSIT = 500;

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly stripeClient: StripeClientService,
    @InjectModel('users') private readonly userModel: Model<User>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createDepositIntent(userId: string, amount: number) {
    const normalizedAmount = this.normalizeAmount(amount);
    const user = await this.userModel
      .findById(userId)
      .select('firstName lastName email')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const referenceId = `STRIPE_${randomUUID()}`;
    const userName =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
    const transaction = new this.transactionModel({
      userId,
      userName,
      type: 'DEPOSIT',
      amount: normalizedAmount,
      status: 'PENDING',
      method: 'STRIPE',
      referenceId,
      currency: STRIPE_CURRENCY.toUpperCase(),
      adminNote: 'Stripe PaymentIntent creation started',
      timestamp: new Date(),
    });
    await transaction.save();

    try {
      const paymentIntent = await this.stripeClient
        .getClient()
        .paymentIntents.create(
          {
            amount: normalizedAmount,
            currency: STRIPE_CURRENCY,
            automatic_payment_methods: { enabled: true },
            description: 'Dice World account top-up',
            metadata: {
              type: 'deposit',
              userId,
              referenceId,
            },
            ...(user.email ? { receipt_email: user.email } : {}),
          },
          { idempotencyKey: referenceId },
        );

      if (!paymentIntent.client_secret) {
        throw new InternalServerErrorException(
          'Stripe did not return a client secret',
        );
      }

      transaction.providerTransactionId = paymentIntent.id;
      transaction.adminNote = `Stripe PaymentIntent: ${paymentIntent.id}`;
      await transaction.save();

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        referenceId,
        amount: normalizedAmount,
        currency: STRIPE_CURRENCY.toUpperCase(),
        status: transaction.status,
      };
    } catch (error) {
      transaction.status = 'FAILED';
      transaction.adminNote = `Stripe PaymentIntent creation failed: ${this.errorMessage(error)}`;
      await transaction.save();
      throw error;
    }
  }

  async getDepositStatus(userId: string, referenceId: string) {
    const transaction = await this.transactionModel
      .findOne({
        userId,
        referenceId,
        type: 'DEPOSIT',
        method: 'STRIPE',
      })
      .exec();

    if (!transaction) {
      throw new NotFoundException('Stripe deposit not found');
    }

    return {
      referenceId: transaction.referenceId,
      paymentIntentId: transaction.providerTransactionId || null,
      amount: transaction.amount,
      currency: transaction.currency || STRIPE_CURRENCY.toUpperCase(),
      status: transaction.status,
      timestamp: transaction.timestamp,
    };
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripeClient.constructEvent(payload, signature);
  }

  async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.creditSuccessfulDeposit(event.id, event.data.object);
      case 'payment_intent.payment_failed':
        await this.recordPaymentFailure(event.data.object);
        return { received: true, status: 'payment_failed' };
      case 'payment_intent.canceled':
        await this.recordPaymentCancellation(event.data.object);
        return { received: true, status: 'canceled' };
      default:
        return { received: true, status: 'ignored' };
    }
  }

  private async creditSuccessfulDeposit(
    eventId: string,
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const metadata = paymentIntent.metadata || {};
    const userId = metadata.userId;
    const referenceId = metadata.referenceId;

    if (metadata.type !== 'deposit' || !userId || !referenceId) {
      this.logger.warn(
        `Ignoring Stripe PaymentIntent ${paymentIntent.id}: deposit metadata is missing`,
      );
      return { received: true, status: 'ignored' };
    }

    if (paymentIntent.currency.toLowerCase() !== STRIPE_CURRENCY) {
      throw new BadRequestException(
        'Stripe payment currency does not match the deposit intent',
      );
    }

    const session = await this.connection.startSession();
    let resultStatus: 'credited' | 'duplicate' = 'credited';

    try {
      await session.withTransaction(async () => {
        const transaction = await this.transactionModel
          .findOne({
            userId,
            referenceId,
            type: 'DEPOSIT',
            method: 'STRIPE',
          })
          .session(session);

        if (!transaction) {
          throw new NotFoundException('Stripe deposit intent not found');
        }

        if (transaction.status === 'SUCCESS') {
          resultStatus = 'duplicate';
          return;
        }

        if (transaction.status !== 'PENDING') {
          throw new ConflictException(
            `Stripe deposit cannot be credited from status ${transaction.status}`,
          );
        }

        if (transaction.providerTransactionId !== paymentIntent.id) {
          throw new ConflictException(
            'Stripe PaymentIntent does not match the deposit intent',
          );
        }

        if (Number(transaction.amount) !== paymentIntent.amount) {
          throw new BadRequestException(
            'Stripe payment amount does not match the deposit intent',
          );
        }

        const claimedTransaction = await this.transactionModel.findOneAndUpdate(
          { _id: transaction._id, status: 'PENDING' },
          {
            $set: {
              status: 'SUCCESS',
              verifiedAt: new Date(),
              adminNote: `Stripe PaymentIntent: ${paymentIntent.id}; event: ${eventId}`,
            },
          },
          { new: true, session },
        );

        if (!claimedTransaction) {
          resultStatus = 'duplicate';
          return;
        }

        const updatedUser = await this.userModel.findByIdAndUpdate(
          userId,
          { $inc: { balance: paymentIntent.amount } },
          { new: true, session },
        );

        if (!updatedUser) {
          throw new NotFoundException('User not found');
        }
      });
    } finally {
      await session.endSession();
    }

    if (resultStatus === 'credited') {
      this.logger.log(
        `Credited Stripe deposit user=${userId} reference=${referenceId} amount=${paymentIntent.amount}`,
      );
    }

    return { received: true, status: resultStatus };
  }

  private async recordPaymentFailure(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const referenceId = paymentIntent.metadata?.referenceId;
    if (!referenceId) {
      return;
    }

    const failureMessage =
      paymentIntent.last_payment_error?.message || 'Payment attempt failed';
    await this.transactionModel.updateOne(
      {
        referenceId,
        providerTransactionId: paymentIntent.id,
        status: 'PENDING',
      },
      { $set: { adminNote: `Stripe: ${failureMessage}` } },
    );
  }

  private async recordPaymentCancellation(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const referenceId = paymentIntent.metadata?.referenceId;
    if (!referenceId) {
      return;
    }

    await this.transactionModel.updateOne(
      {
        referenceId,
        providerTransactionId: paymentIntent.id,
        status: 'PENDING',
      },
      {
        $set: {
          status: 'FAILED',
          verifiedAt: new Date(),
          adminNote: 'Stripe PaymentIntent canceled',
        },
      },
    );
  }

  private normalizeAmount(amount: number): number {
    const normalized = Number(amount);
    if (
      !Number.isSafeInteger(normalized) ||
      normalized < MIN_STRIPE_DEPOSIT ||
      normalized > 99_999_999
    ) {
      throw new BadRequestException(
        `Deposit amount must be a whole number between ${MIN_STRIPE_DEPOSIT} and 99999999 CFA`,
      );
    }
    return normalized;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
