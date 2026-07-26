import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { env } from '../config/env.js';

dotenv.config();

const seedAdmin = async () => {
  await mongoose.connect(env.mongoUri);

  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Platform Admin';

  if (!email || !password) {
    console.error('Usage: node src/scripts/seedAdmin.js <email> <password> [name]');
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists with email: ${email}`);
    process.exit(0);
  }

  await User.create({
    name,
    email,
    password,
    role: 'admin',
    isEmailVerified: true,
    isActive: true,
  });

  console.log(`Admin created successfully: ${email}`);
  process.exit(0);
};

seedAdmin().catch((error) => {
  console.error(`Failed to seed admin: ${error.message}`);
  process.exit(1);
});
