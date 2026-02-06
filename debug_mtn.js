const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function debugMtn() {
    const baseUrl = 'https://sandbox.momodeveloper.mtn.com';

    // Credentials (from MtnService.ts)
    const colUserId = '56d0b986-b297-4e15-9a94-9e1befb2494c';
    const colApiKey = '31ccd8259ce3486295171291ea576dbe';
    const colSubKey = 'b338f39aef1a42aba70089f01c9739c0';

    // 1. Get Token
    console.log('--- Getting Token ---');
    const auth = Buffer.from(`${colUserId}:${colApiKey}`).toString('base64');
    let token;
    try {
        const res = await axios.post(`${baseUrl}/collection/token/`, {}, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Ocp-Apim-Subscription-Key': colSubKey
            }
        });
        token = res.data.access_token;
        console.log('Token acquired:', token.substring(0, 10) + '...');
    } catch (e) {
        console.error('Token Error:', e.response?.data || e.message);
        return;
    }

    // 2. Request to Pay
    console.log('\n--- Requesting Payment ---');
    const referenceId = uuidv4();
    const phone = '46733123453'; // Test number usually accepted in sandbox
    const payload = {
        amount: "500",
        currency: "EUR", // Trying EUR as per some sandbox defaults, or XOF
        externalId: "123456",
        payer: {
            partyIdType: "MSISDN",
            partyId: phone
        },
        payerMessage: "Test msg",
        payeeNote: "Test note"
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('X-Reference-Id:', referenceId);

    try {
        await axios.post(`${baseUrl}/collection/v1_0/requesttopay`, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Reference-Id': referenceId,
                'X-Target-Environment': 'sandbox',
                'Ocp-Apim-Subscription-Key': colSubKey,
                'Content-Type': 'application/json'
            }
        });
        console.log('SUCCESS! Reference ID:', referenceId);
    } catch (e) {
        console.error('RequestToPay Error Status:', e.response?.status);
        console.error('RequestToPay Error Data:', JSON.stringify(e.response?.data, null, 2));
        console.error('RequestToPay Error Headers:', JSON.stringify(e.response?.headers, null, 2));
    }
}

debugMtn();
