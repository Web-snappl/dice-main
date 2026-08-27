const mongoose = require('mongoose');
const fs = require('fs');

try {
    fs.writeFileSync('debug_output.txt', 'Script started\n');
} catch (error) {
    console.error('FS Error:', error);
}

const uri = process.env.MONGO_URI;

if (!uri) {
    throw new Error('MONGO_URI environment variable is required');
}

mongoose.connect(uri)
    .then(async () => {
        fs.appendFileSync('debug_output.txt', 'Connected!\n');

        const collections = await mongoose.connection.db.listCollections().toArray();
        fs.appendFileSync('debug_output.txt', `Collections: ${JSON.stringify(collections.map((collection) => collection.name))}\n`);

        const count = await mongoose.connection.db.collection('users').countDocuments();
        fs.appendFileSync('debug_output.txt', `Users count: ${count}\n`);

        process.exit(0);
    })
    .catch((error) => {
        fs.appendFileSync('debug_output.txt', `Error: ${error.message}\n`);
        process.exit(1);
    });
