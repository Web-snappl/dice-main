/**
 * Standalone admin seeder script
 * 
 * Usage:
 *   node scripts/seed-admin.js [email] [password]
 * 
 * Set MONGO_URI environment variable for database connection
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dice-game';

// User schema matching the existing one
const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    phoneNumber: { type: String, unique: true, sparse: true },
    password: String,
    adminPasswordHash: String,
    firstName: String,
    lastName: String,
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
}, { timestamps: true });

async function seedAdmin() {
    const email = process.argv[2] || 'admin@dice-world.com';
    const password = process.argv[3] || 'AdminPassword123!';

    console.log('Connecting to MongoDB...');
    console.log('URI:', MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) {
            console.log('User with this email already exists!');

            const hashedPassword = await bcrypt.hash(password, 10);

            existing.role = 'admin';
            existing.status = 'active';
            existing.adminPasswordHash = hashedPassword;

            // Also update regular password field if it exists, to keep data consistent (optional)
            if (existing.password) {
                existing.password = hashedPassword;
            }

            await existing.save();
            console.log('Updated existing user with admin role and new password.');

            await mongoose.disconnect();
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const admin = await User.create({
            email,
            password: hashedPassword, // Keep for backward compatibility
            adminPasswordHash: hashedPassword, // New field for admin auth
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            status: 'active',
        });

        console.log('\n✅ Admin user created successfully!');
        console.log('=====================================');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('ID:', admin._id);
        console.log('=====================================\n');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Failed to seed admin:', error.message);
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n⚠️  MongoDB is not running!');
            console.log('Please start MongoDB or update MONGO_URI in .env file.');
        }
        process.exit(1);
    }
}

seedAdmin();
