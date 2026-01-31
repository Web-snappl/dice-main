const mongoose = require('mongoose');
const fs = require('fs');

try {
    fs.writeFileSync('debug_output.txt', 'Script started\n');
} catch (e) {
    console.error('FS Error:', e);
}

const uri = "mongodb+srv://websnapinfo_db_user:hRisYXdcS2fC8AjC@dice-world.ixhcuda.mongodb.net/dice-game?retryWrites=true&w=majority&appName=dice-world";

mongoose.connect(uri)
    .then(async () => {
        fs.appendFileSync('debug_output.txt', 'Connected!\n');

        const collections = await mongoose.connection.db.listCollections().toArray();
        fs.appendFileSync('debug_output.txt', 'Collections: ' + JSON.stringify(collections.map(c => c.name)) + '\n');

        const count = await mongoose.connection.db.collection('users').countDocuments();
        fs.appendFileSync('debug_output.txt', 'Users count: ' + count + '\n');

        process.exit(0);
    })
    .catch(err => {
        fs.appendFileSync('debug_output.txt', 'Error: ' + err.message + '\n');
        process.exit(1);
    });
