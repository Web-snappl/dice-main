require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('debug.log', msg + '\n');
}

log('Starting script...');

const uri = process.env.MONGO_URI;
log('URI length: ' + (uri ? uri.length : 0));

if (!uri) {
    log('No URI found');
    process.exit(1);
}

mongoose.connect(uri)
    .then(async () => {
        log('Connected to DB');
        const collections = await mongoose.connection.db.listCollections().toArray();
        log('Collections: ' + JSON.stringify(collections.map(c => c.name)));

        // Try 'users' and 'Users'
        const usersLower = await mongoose.connection.db.collection('users').countDocuments();
        const usersCapital = await mongoose.connection.db.collection('Users').countDocuments();

        log(`users count: ${usersLower}`);
        log(`Users count: ${usersCapital}`);

        if (usersLower > 0) {
            const sample = await mongoose.connection.db.collection('users').findOne({});
            log('Sample: ' + JSON.stringify(sample));
        }

        process.exit(0);
    })
    .catch(err => {
        log('Connection failed: ' + err);
        process.exit(1);
    });
