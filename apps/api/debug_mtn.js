const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function debugMtn() {
    const baseUrl = 'https://sandbox.momodeveloper.mtn.com';

    // Credentials (Updated from provision_mtn_user.js)
    const colUserId = '865709a6-eef2-4fbd-9c0b-9cc53b998cc5';
    const colApiKey = 'd2345adb2994471f8c41306037976a6d';
    const colSubKey = 'b338f39aef1a42aba70089f01c9739c0';

    // Auth
    console.log('1. Generating Token...');
    const auth = Buffer.from(`${colUserId}:${colApiKey}`).toString('base64');
    let token;

    try {
        const tokenRes = await axios.post(
            `${baseUrl}/collection/token/`,
            {},
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Ocp-Apim-Subscription-Key': colSubKey
                }
            }
        );
        token = tokenRes.data.access_token;
        console.log('✅ Token Generated:', token.substring(0, 10) + '...');
    } catch (e) {
        console.error('❌ Token Failed:', e.response?.data || e.message);
        return;
    }

    // Deposit
    console.log('2. Requesting Deposit...');
    const referenceId = uuidv4();
    const userPhone = '46733123453'; // Valid Sandbox Test Number (format: 229...) but docs say generic number works in sandbox? Let's try explicit 229 prefix if this fails, but sandbox usually accepts anything or specific test numbers. 
    // Sandbox User Guide: "For sandbox, use the following test numbers..."
    // Let's try with the number we see in logs or a generic valid one.
    // The previous logs showed: 46733123453

    try {
        await axios.post(
            `${baseUrl}/collection/v1_0/requesttopay`,
            {
                amount: '500',
                currency: 'EUR', // Sandbox = EUR
                externalId: referenceId,
                payer: {
                    partyIdType: 'MSISDN',
                    partyId: userPhone
                },
                payerMessage: 'Debug Deposit',
                payeeNote: 'Debug'
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': 'sandbox',
                    'Ocp-Apim-Subscription-Key': colSubKey,
                    'X-Callback-Url': 'https://api-production-6de9.up.railway.app/api/mtn/webhook'
                }
            }
        );
        console.log('✅ Deposit Request Successful!');
    } catch (e) {
        console.error('❌ Deposit Failed!');
        console.error('Status:', e.response?.status);
        console.error('Data:', JSON.stringify(e.response?.data, null, 2));
        console.error('Headers:', e.response?.headers);
    }
}

debugMtn();
