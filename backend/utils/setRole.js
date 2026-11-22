import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

const email = process.argv[2];
const role = process.argv[3] || 'admin';

if (!email) {
  console.log('Usage: node utils/setRole.js <user-email> [admin|user]');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snapshare');
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role },
      { new: true }
    );

    if (!user) {
      console.log(`❌ User with email "${email}" not found.`);
    } else {
      console.log(`✅ Success! Updated user "${user.name}" (${user.email}) to role: "${user.role}"`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error updating role:', err.message);
    process.exit(1);
  }
};

run();
