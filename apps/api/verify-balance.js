
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@dice-world.com';
const ADMIN_PASSWORD = 'AdminPassword123!';

async function verify() {
    const results = { steps: [], success: false };

    try {
        results.steps.push(`CWD: ${process.cwd()}`);

        // 1. Login
        results.steps.push('Logging in...');
        const loginRes = await axios.post(`${API_URL}/admin/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.accessToken;
        results.steps.push('Login successful');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get Users to find one to update
        results.steps.push('Fetching users...');
        const usersRes = await axios.get(`${API_URL}/admin/users?limit=1`, { headers });
        const users = usersRes.data.users;

        if (users.length === 0) {
            results.error = 'No users found to test';
        } else {
            const targetUser = users[0];
            results.steps.push(`Found user: ${targetUser.id} (${targetUser.firstName})`);

            // 3. Update Balance
            const currentBalance = targetUser.balance || 0;
            const newBalance = currentBalance + 100;
            results.steps.push(`Updating balance from ${currentBalance} to ${newBalance}...`);

            const updateRes = await axios.patch(`${API_URL}/admin/users/${targetUser.id}`,
                { balance: newBalance },
                { headers }
            );

            results.steps.push('Update request sent');

            if (updateRes.data.balance === newBalance) {
                results.success = true;
                results.steps.push('Balance updated successfully in response');
            } else {
                results.error = `Balance mismatch. Expected ${newBalance}, got ${updateRes.data.balance}`;
            }
        }

    } catch (error) {
        results.error = error.message;
        if (error.response) {
            results.apiError = {
                status: error.response.status,
                data: error.response.data
            };
        }
    } finally {
        const outFile = path.resolve(__dirname, 'verification_result_v2.json');
        console.log('Writing results to:', outFile);
        fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    }
}

verify();
