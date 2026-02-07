const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function testWebhook() {
    const url = 'https://api-production-6de9.up.railway.app/api/mtn/webhook';
    const fakeId = uuidv4();

    console.log(`Pinging Webhook at: ${url}`);
    console.log(`Using Fake Reference ID: ${fakeId}`);

    try {
        const response = await axios.post(url, {
            externalId: fakeId,
            status: 'SUCCESSFUL',
            amount: '500',
            currency: 'EUR',
            financialTransactionId: 'TEST_TX_123'
        });

        console.log('✅ Webhook Response:', response.data);
        console.log('Status Code:', response.status);

        if (response.data.status === 'acknowledged') {
            console.log('🚀 SUCCESS: Webhook is reachable and responding correctly (Transaction not found is expected).');
        } else {
            console.log('⚠️ Unexpected response status.');
        }

    } catch (error) {
        console.error('❌ Webhook Request Failed!');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
    }
}

testWebhook();
