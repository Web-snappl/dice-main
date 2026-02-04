
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@dice-world.com';
const ADMIN_PASSWORD = 'AdminPassword123!';

async function debug() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/admin/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.accessToken;
        const headers = { Authorization: `Bearer ${token}` };

        console.log('Fetching users...');
        const usersRes = await axios.get(`${API_URL}/admin/users?limit=1`, { headers });
        const user = usersRes.data.users[0];

        if (!user) {
            console.log('No users found');
            return;
        }

        console.log(`Current Balance for ${user.email}: ${user.balance}`);

        const newBalance = (user.balance || 0) + 50;
        console.log(`Updating to: ${newBalance}`);

        const updateRes = await axios.patch(`${API_URL}/admin/users/${user.id}`,
            { balance: newBalance },
            { headers }
        );

        console.log('Update Response Balance:', updateRes.data.balance);

    } catch (e) {
        console.error('Error:', e.message);
        results.error = e.message;
        if (e.response) {
            results.details = e.response.data;
        }
    } finally {
        const fs = require('fs');
        fs.writeFileSync('debug_output.json', JSON.stringify(results, null, 2));
    }
}

// Global results object
const results = { logs: [] };
const originalLog = console.log;
console.log = (...args) => {
    results.logs.push(args.join(' '));
    originalLog(...args);
};

debug();
