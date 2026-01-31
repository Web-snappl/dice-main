require('dotenv').config();
const mongoose = require('mongoose');

console.log('Script started');
const uri = process.env.MONGO_URI;
console.log('URI: ' + (uri ? 'Exists' : 'Missing'));

if (!uri) process.exit(1);

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected');
        const count = await mongoose.connection.db.collection('users').countDocuments();
        console.log('Users count: ' + count);

        const users = await mongoose.connection.db.collection('users').find({}).limit(5).toArray();
        console.log('Sample users: ' + JSON.stringify(users, null, 2));

        process.exit(0);
    })
    .catch(err => {
        console.log('Error: ' + err.message);
        process.exit(1);
    });

// Keep alive just in case
setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
}, 10000);
