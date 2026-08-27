const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;
const LOG_FILE = path.join(__dirname, 'debug_result.json');

if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required');
}

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    password: String,
    role: String,
    status: String,
    balance: { type: Number, default: 0 },
    adminPasswordHash: String,
}, { versionKey: '__v' });

const User = mongoose.model('users', userSchema);

const log = (data) => fs.writeFileSync(LOG_FILE, JSON.stringify(data, null, 2));

async function run() {
    const result = { status: 'PENDING' };
    try {
        result.step = 'CONNECTING';
        log(result);

        await mongoose.connect(MONGO_URI);
        result.step = 'CONNECTED';
        log(result);

        console.log('Testing query...');
        try {
            const users = await User.find({})
                .select('-password -adminPasswordHash +balance')
                .limit(1)
                .exec();

            result.status = 'SUCCESS';
            result.count = users.length;
            if (users.length > 0) result.keys = Object.keys(users[0].toObject());
            log(result);
        } catch (error) {
            result.status = 'FAILED';
            result.error = error.message;
            result.stack = error.stack;
            log(result);
        }
    } catch (error) {
        result.status = 'CRASHED';
        result.error = error.message;
        log(result);
    } finally {
        await mongoose.disconnect();
    }
}

run();
