import { Injectable, Logger, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class MtnService {
    private readonly logger = new Logger(MtnService.name);

    // Config
    private readonly baseUrl = 'https://sandbox.momodeveloper.mtn.com';

    // Collection Credentials
    // Collection Credentials
    private readonly colUserId = '865709a6-eef2-4fbd-9c0b-9cc53b998cc5';
    private readonly colApiKey = 'd2345adb2994471f8c41306037976a6d';
    private readonly colSubKey = 'b338f39aef1a42aba70089f01c9739c0';

    // Disbursement Credentials
    private readonly disUserId = '5f74a2c1-65a4-496b-89e1-174c285b1e91';
    private readonly disApiKey = '94e2cfddfe3245d7b0702af020027fb1';
    private readonly disSubKey = '8cc32bf49a0b4c2f9fa80785ad634962';

    constructor(
        private readonly transactionsService: TransactionsService,
    ) { }

    /**
     * Request a Deposit (Collection)
     */
    async requestDeposit(userId: string, userPhone: string, amount: number) {
        try {
            this.logger.log(`Initiating MTN Deposit: ${amount} XOF from ${userPhone} (Sandbox: EUR)`);
            const token = await this.getToken('collection');
            const referenceId = uuidv4();

            // Create Pending Transaction
            await this.transactionsService.create({
                userId,
                type: 'DEPOSIT',
                amount,
                status: 'PENDING',
                method: 'MTN',
                referenceId,
                adminNote: `Phone: ${userPhone}`
            });

            const payload = {
                amount: amount.toString(),
                currency: 'EUR', // Sandbox only supports EUR
                externalId: referenceId,
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: userPhone
                },
                payerMessage: 'Deposit to Dice App',
                payeeNote: 'Deposit'
            };

            this.logger.log(`[MTN Request] Payload: ${JSON.stringify(payload)}`);

            try {
                await axios.post(
                    `${this.baseUrl}/collection/v1_0/requesttopay`,
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-Reference-Id': referenceId,
                            'X-Target-Environment': 'sandbox',
                            'Ocp-Apim-Subscription-Key': this.colSubKey,
                            'X-Callback-Url': 'https://api-production-6de9.up.railway.app/api/mtn/webhook',
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } catch (error) {
                this.logger.error(`[MTN Error] Data: ${JSON.stringify(error.response?.data)}`);
                this.logger.error(`[MTN Error] Status: ${error.response?.status}`);
                throw new BadRequestException('MTN Payment Request Failed');
            }

            return {
                status: 'PENDING',
                message: 'Payment request sent. Please check your phone.',
                referenceId
            };
        } catch (error) {
            this.logger.error(`[MTN Error] Status: ${error.response?.status}`);
            this.logger.error(`[MTN Error] Data: ${JSON.stringify(error.response?.data)}`);
            this.logger.error(`Deposit Failed: ${error.message}`, error.response?.data);
            throw new HttpException(
                `MTN Deposit Failed: ${error.response?.data?.message || error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Request a Withdrawal (Disbursement)
     */
    async requestWithdrawal(userId: string, userPhone: string, amount: number) {
        try {
            this.logger.log(`Initiating MTN Withdrawal: ${amount} XOF to ${userPhone} (Sandbox: EUR)`);
            const token = await this.getToken('disbursement');
            const referenceId = uuidv4();

            // Create Pending Withdrawal
            await this.transactionsService.create({
                userId,
                type: 'WITHDRAWAL',
                amount,
                status: 'PENDING', // Will be updated by Webhook or manually
                method: 'MTN',
                referenceId,
                adminNote: `Phone: ${userPhone}`
            });

            await axios.post(
                `${this.baseUrl}/disbursement/v1_0/transfer`,
                {
                    amount: amount.toString(),
                    currency: 'EUR', // Sandbox only supports EUR
                    externalId: referenceId,
                    payee: {
                        partyIdType: 'MSISDN',
                        partyId: userPhone
                    },
                    payerMessage: 'Withdrawal from Dice App',
                    payeeNote: 'Withdrawal'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Reference-Id': referenceId,
                        'X-Target-Environment': 'sandbox',
                        'Ocp-Apim-Subscription-Key': this.disSubKey
                    }
                }
            );

            return {
                status: 'SUCCESS', // Initiated successfully
                message: 'Withdrawal initiated successfully',
                referenceId
            };
        } catch (error) {
            this.logger.error(`Withdrawal Failed: ${error.message}`, error.response?.data);
            throw new HttpException(
                `MTN Withdrawal Failed: ${error.response?.data?.message || error.message}`,
                HttpStatus.BAD_REQUEST
            );
        }
    }

    /**
     * Get OAuth Token
     */
    private async getToken(product: 'collection' | 'disbursement'): Promise<string> {
        const userId = product === 'collection' ? this.colUserId : this.disUserId;
        const apiKey = product === 'collection' ? this.colApiKey : this.disApiKey;
        const subKey = product === 'collection' ? this.colSubKey : this.disSubKey;
        const path = product === 'collection' ? 'collection' : 'disbursement';

        const auth = Buffer.from(`${userId}:${apiKey}`).toString('base64');

        try {
            const response = await axios.post(
                `${this.baseUrl}/${path}/token/`,
                {},
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Ocp-Apim-Subscription-Key': subKey
                    }
                }
            );
            return response.data.access_token;
        } catch (error) {
            this.logger.error(`Token Generation Failed (${product}): ${error.message}`, error.response?.data);
            throw new HttpException(
                `MTN Auth Failed: ${error.response?.data?.message || error.message}`,
                HttpStatus.BAD_GATEWAY
            );
        }
    }
}
