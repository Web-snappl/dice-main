import Stripe from 'stripe';
import { BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  const paymentIntentsCreate = jest.fn();
  const stripeClient = {
    getClient: jest.fn(() => ({
      paymentIntents: { create: paymentIntentsCreate },
    })),
    constructEvent: jest.fn(),
  };
  const userModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };
  const transactionModel = Object.assign(jest.fn(), {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  });
  const session = {
    withTransaction: jest.fn(async (work: () => Promise<void>) => work()),
    endSession: jest.fn(),
  };
  const connection = {
    startSession: jest.fn(async () => session),
  };

  let service: StripeService;

  beforeEach(() => {
    jest.clearAllMocks();
    session.withTransaction.mockImplementation(
      async (work: () => Promise<void>) => work(),
    );
    connection.startSession.mockResolvedValue(session);
    service = new StripeService(
      stripeClient as any,
      userModel as any,
      transactionModel as any,
      connection as any,
    );
  });

  it('creates a pending XOF deposit for the authenticated user', async () => {
    const savedTransactions: any[] = [];
    transactionModel.mockImplementation((data) => {
      const document = {
        ...data,
        save: jest.fn(async function () {
          savedTransactions.push({ ...this });
          return this;
        }),
      };
      return document;
    });
    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
        }),
      }),
    });
    paymentIntentsCreate.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'pi_123_secret_abc',
    });

    const result = await service.createDepositIntent('user_123', 1200);

    expect(paymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1200,
        currency: 'xof',
        metadata: expect.objectContaining({
          type: 'deposit',
          userId: 'user_123',
        }),
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^STRIPE_/),
      }),
    );
    expect(savedTransactions[0]).toEqual(
      expect.objectContaining({
        userId: 'user_123',
        amount: 1200,
        status: 'PENDING',
        method: 'STRIPE',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        clientSecret: 'pi_123_secret_abc',
        paymentIntentId: 'pi_123',
        amount: 1200,
        currency: 'XOF',
      }),
    );
  });

  it('rejects deposits below the Stripe minimum for XOF', async () => {
    await expect(service.createDepositIntent('user_123', 200)).rejects.toThrow(
      BadRequestException,
    );
    expect(userModel.findById).not.toHaveBeenCalled();
    expect(paymentIntentsCreate).not.toHaveBeenCalled();
  });

  it('credits a successful PaymentIntent only once', async () => {
    const transaction: any = {
      _id: 'transaction_123',
      userId: 'user_123',
      referenceId: 'STRIPE_reference',
      type: 'DEPOSIT',
      method: 'STRIPE',
      amount: 2000,
      status: 'PENDING',
      providerTransactionId: 'pi_123',
    };
    transactionModel.findOne.mockReturnValue({
      session: jest.fn(async () => transaction),
    });
    transactionModel.findOneAndUpdate.mockImplementation(async () => {
      transaction.status = 'SUCCESS';
      return transaction;
    });
    userModel.findByIdAndUpdate.mockResolvedValue({
      _id: 'user_123',
      balance: 2000,
    });

    const event = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_123',
          amount: 2000,
          currency: 'xof',
          metadata: {
            type: 'deposit',
            userId: 'user_123',
            referenceId: 'STRIPE_reference',
          },
        },
      },
    } as unknown as Stripe.Event;

    const firstResult = await service.handleEvent(event);
    const duplicateResult = await service.handleEvent(event);

    expect(firstResult).toEqual({ received: true, status: 'credited' });
    expect(duplicateResult).toEqual({ received: true, status: 'duplicate' });
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'user_123',
      { $inc: { balance: 2000 } },
      expect.objectContaining({ new: true, session }),
    );
    expect(session.endSession).toHaveBeenCalledTimes(2);
  });
});
