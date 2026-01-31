const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login...');
        const response = await axios.post('https://api-production-a16d.up.railway.app/api/admin/auth/login', {
            email: process.env.ADMIN_EMAIL || 'dice@admin.com',
            password: process.env.ADMIN_PASSWORD || 'password'
        });
        console.log('Login Successful:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Login Failed:', error.response.status, error.response.data);
        } else {
            console.error('Network/Other Error:', error.message);
        }
    }
}

testLogin();
