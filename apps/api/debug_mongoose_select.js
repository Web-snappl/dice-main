
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://websnapinfo_db_user:hRisYXdcS2fC8AjC@dice-world.ixhcuda.mongodb.net/dice-game?retryWrites=true&w=majority&appName=dice-world';
const LOG_FILE = path.join(__dirname, 'debug_result.json');

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
        } catch (err) {
            result.status = 'FAILED';
            result.error = err.message;
            result.stack = err.stack;
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
