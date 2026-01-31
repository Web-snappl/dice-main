const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');

async function debugUsers() {
    const uri = process.env.MONGO_URI; // Checked .env, it's MONGO_URI
    if (!uri) {
        console.error('MONGO_URI is not defined in .env');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected!');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const usersCollection = mongoose.connection.db.collection('users');
        const users = await usersCollection.find({}).toArray();

        console.log(`Found ${users.length} users in 'users' collection.`);
        if (users.length > 0) {
            console.log('Sample user:', JSON.stringify(users[0], null, 2));

            // Check specific fields used in Admin Panel
            const adminUser = users.find(u => u.role === 'admin' || u.role === 'moderator');
            const regularUser = users.find(u => u.role === 'user');

            console.log('Sample Admin/Mod:', adminUser ? 'Found' : 'Not Found');
            console.log('Sample Regular User:', regularUser ? 'Found' : 'Not Found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugUsers();
