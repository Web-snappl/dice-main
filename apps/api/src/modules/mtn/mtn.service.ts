import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MtnService {
    private readonly logger = new Logger(MtnService.name);

    // Config
    private readonly baseUrl = 'https://sandbox.momodeveloper.mtn.com';

    // Collection Credentials
    private readonly colUserId = '56d0b986-b297-4e15-9a94-9e1befb2494c';
    private readonly colApiKey = '31ccd8259ce3486295171291ea576dbe';
    private readonly colSubKey = 'b338f39aef1a42aba70089f01c9739c0';

    // Disbursement Credentials
    private readonly disUserId = '8307c5c3-d27b-46d8-816b-4d88c42b5c4e';
    private readonly disApiKey = '92b789c41f9145e1a9d7bdbbc6191d8f';
    private readonly disSubKey = '8cc32bf49a0b4c2f9fa80785ad634962';

    constructor() { }

    /**
     * Request a Deposit (Collection)
     */
    async requestDeposit(userPhone: string, amount: number) {
        try {
            this.logger.log(`Initiating MTN Deposit: ${amount} XOF from ${userPhone}`);
            const token = await this.getToken('collection');
            const referenceId = uuidv4();

            await axios.post(
                `${this.baseUrl}/collection/v1_0/requesttopay`,
                {
                    amount: amount.toString(),
                    currency: 'XOF',
                    externalId: referenceId,
                    payer: {
                        partyIdType: 'MSISDN',
                        partyId: userPhone
                    },
                    payerMessage: 'Deposit to Dice App',
                    payeeNote: 'Deposit'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Reference-Id': referenceId,
                        'X-Target-Environment': 'sandbox',
                        'Ocp-Apim-Subscription-Key': this.colSubKey
                    }
                }
            );

            return {
                status: 'PENDING',
                message: 'Payment request sent. Please check your phone.',
                referenceId
            };
        } catch (error) {
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
    async requestWithdrawal(userPhone: string, amount: number) {
        try {
            this.logger.log(`Initiating MTN Withdrawal: ${amount} XOF to ${userPhone}`);
            const token = await this.getToken('disbursement');
            const referenceId = uuidv4();

            await axios.post(
                `${this.baseUrl}/disbursement/v1_0/transfer`,
                {
                    amount: amount.toString(),
                    currency: 'XOF',
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
                status: 'SUCCESS',
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
