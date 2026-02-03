#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('🚀 Medical Inventory Management System - Setup Script');
console.log('====================================================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js 18+ is required. Current version:', nodeVersion);
  process.exit(1);
}

console.log('✅ Node.js version:', nodeVersion);

// Create .env file for backend
const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/medical_inventory
MONGODB_TEST_URI=mongodb://localhost:27017/medical_inventory_test

# JWT Configuration
JWT_SECRET=medical-inventory-super-secret-jwt-key-2024
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=medical-inventory-refresh-secret-key-2024
JWT_REFRESH_EXPIRE=30d

# External APIs
OPENFDA_API_URL=https://api.fda.gov/drug/label.json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# CORS
CORS_ORIGIN=http://localhost:5173

# Security
BCRYPT_ROUNDS=12`;

try {
  // Create backend .env file
  writeFileSync('backend/.env', envContent);
  console.log('✅ Created backend/.env file');

  // Create logs directory
  mkdirSync('backend/logs', { recursive: true });
  console.log('✅ Created logs directory');

  // Install backend dependencies
  console.log('\n📦 Installing backend dependencies...');
  execSync('npm install', { cwd: 'backend', stdio: 'inherit' });
  console.log('✅ Backend dependencies installed');

  // Check if MongoDB is running
  try {
    execSync('mongod --version', { stdio: 'pipe' });
    console.log('✅ MongoDB is available');
  } catch (error) {
    console.log('⚠️  MongoDB not found. Please install MongoDB:');
    console.log('   - Windows: Download from https://www.mongodb.com/try/download/community');
    console.log('   - macOS: brew install mongodb-community');
    console.log('   - Linux: sudo apt-get install mongodb');
  }

  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Start MongoDB: mongod');
  console.log('2. Seed the database: cd backend && npm run seed');
  console.log('3. Start the backend: cd backend && npm run dev');
  console.log('4. Start the frontend: cd "Inventory Management System" && npm run dev');
  
  console.log('\n🔑 Default Login Credentials:');
  console.log('   Admin: aman@medical.com / 12345678');
  console.log('   Inventory: ben@medical.com / 1234');
  console.log('   Doctor: chloe@medical.com / 1234');
  console.log('   Supplier: supplybot@medical.com / 1234');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}

