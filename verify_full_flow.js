
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'admin@dice-world.com';
const ADMIN_PASSWORD = 'AdminPassword123!';
const LOG_FILE = path.join(__dirname, 'verification_results.json');

const results = {
    steps: [],
    summary: 'STARTED',
    error: null
};

function logStep(step, status, data = null) {
    results.steps.push({ step, status, timestamp: new Date(), data });
    fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
}

async function runTest() {
    let token;
    let createdUserId;

    try {
        // 1. Login
        try {
            const loginRes = await axios.post(`${API_URL}/admin/auth/login`, {
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
            });
            token = loginRes.data.accessToken;
            logStep('Login', 'SUCCESS', { tokenLength: token.length });
        } catch (e) {
            logStep('Login', 'FAILED', { message: e.message, response: e.response?.data });
            throw e;
        }

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create User
        try {
            const createRes = await axios.post(`${API_URL}/admin/users`, {
                firstName: 'Test',
                lastName: 'User',
                email: `verify_${Date.now()}@example.com`,
                phoneNumber: `+555${Date.now()}`,
                password: 'Password123!',
                role: 'user'
            }, { headers });
            createdUserId = createRes.data.id;
            logStep('CreateUser', 'SUCCESS', { id: createdUserId });
        } catch (e) {
            logStep('CreateUser', 'FAILED', { message: e.message, response: e.response?.data });
            // Continue if create fails? Only if we want to test listing existing users.
        }

        // 3. List Users
        try {
            const listRes = await axios.get(`${API_URL}/admin/users?limit=50`, { headers });
            const users = listRes.data.users || [];
            logStep('ListUsers', 'SUCCESS', { count: users.length, total: listRes.data.total });

            if (createdUserId) {
                const found = users.find(u => u.id === createdUserId);
                logStep('FindCreatedUserInList', found ? 'SUCCESS' : 'FAILED', { foundId: found?.id });
            }
        } catch (e) {
            logStep('ListUsers', 'FAILED', { message: e.message, response: e.response?.data });
        }

        if (!createdUserId) return;

        // 4. Update Balance
        try {
            const updateRes = await axios.patch(`${API_URL}/admin/users/${createdUserId}`,
                { balance: 999 },
                { headers }
            );
            logStep('UpdateBalance', 'SUCCESS', { newBalance: updateRes.data.balance });

            // Verify
            const getRes = await axios.get(`${API_URL}/admin/users/${createdUserId}`, { headers });
            logStep('VerifyBalancePersistence', getRes.data.balance === 999 ? 'SUCCESS' : 'FAILED', { fetchedBalance: getRes.data.balance });
        } catch (e) {
            logStep('UpdateBalance', 'FAILED', { message: e.message, response: e.response?.data });
        }

        // 5. Delete User
        try {
            await axios.delete(`${API_URL}/admin/users/${createdUserId}`, { headers });
            logStep('DeleteUser', 'SUCCESS');

            // Verify Deletion
            try {
                await axios.get(`${API_URL}/admin/users/${createdUserId}`, { headers });
                logStep('VerifyDeletion', 'FAILED', { detail: 'User still exists' });
            } catch (e) {
                if (e.response?.status === 404) {
                    logStep('VerifyDeletion', 'SUCCESS', { detail: '404 Not Found' });
                } else {
                    logStep('VerifyDeletion', 'ERROR', { message: e.message });
                }
            }
        } catch (e) {
            logStep('DeleteUser', 'FAILED', { message: e.message, response: e.response?.data });
        }

        results.summary = 'COMPLETED';
        fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));

    } catch (e) {
        results.summary = 'CRASHED';
        results.error = e.message;
        fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
    }
}

runTest();
