const https = require('https');
const crypto = require('crypto');

// Keys provided by user
const COLLECTION_SUB_KEY = 'b338f39aef1a42aba70089f01c9739c0';
const DISBURSEMENT_SUB_KEY = '8cc32bf49a0b4c2f9fa80785ad634962';

const BASE_URL = 'sandbox.momodeveloper.mtn.com';

function request(method, path, headers, body) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: BASE_URL,
            path: path,
            method: method,
            headers: headers
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
                } else {
                    reject({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function provision(name, subKey) {
    console.log(`\n--- Provisioning ${name} ---`);
    const referenceId = crypto.randomUUID(); // This will be our API User ID
    console.log(`1. Generated User ID (X-Reference-Id): ${referenceId}`);

    try {
        // Step 1: Create API User
        console.log('2. Creating API User...');
        await request('POST', '/v1_0/apiuser', {
            'X-Reference-Id': referenceId,
            'Ocp-Apim-Subscription-Key': subKey,
            'Content-Type': 'application/json'
        }, { providerCallbackHost: 'https://dice-main-production.up.railway.app/api/mtn/webhook' });
        console.log('   User Created (201 Created)');

        // Step 2: Create API Key
        console.log('3. Generating API Key...');
        const res = await request('POST', `/v1_0/apiuser/${referenceId}/apikey`, {
            'Ocp-Apim-Subscription-Key': subKey
        });

        const apiKey = res.body.apiKey;
        console.log(`   API Key Generated!`);

        return {
            referenceId,
            apiKey,
            subKey
        };

    } catch (e) {
        console.error(`FAILED to provision ${name}:`, e);
        return null;
    }
}

async function main() {
    console.log('Starting MTN Sandbox Provisioning...');

    const collection = await provision('COLLECTION', COLLECTION_SUB_KEY);
    const disbursement = await provision('DISBURSEMENT', DISBURSEMENT_SUB_KEY);

    console.log('\n\n=== 🔐 SAVE THESE CREDENTIALS TO .env ===');

    if (collection) {
        console.log('\n# MTN Collection (Deposits)');
        console.log(`MTN_COLLECTION_USER_ID=${collection.referenceId}`);
        console.log(`MTN_COLLECTION_API_KEY=${collection.apiKey}`);
        console.log(`MTN_COLLECTION_SUB_KEY=${collection.subKey}`);
    }

    if (disbursement) {
        console.log('\n# MTN Disbursement (Withdrawals)');
        console.log(`MTN_DISBURSEMENT_USER_ID=${disbursement.referenceId}`);
        console.log(`MTN_DISBURSEMENT_API_KEY=${disbursement.apiKey}`);
        console.log(`MTN_DISBURSEMENT_SUB_KEY=${disbursement.subKey}`);
    }
    console.log('\n=========================================');
}

main();
