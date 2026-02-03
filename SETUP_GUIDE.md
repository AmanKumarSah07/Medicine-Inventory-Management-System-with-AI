# 🚀 Medical Inventory Management System - Setup Guide

## Quick Start (Windows)

### Option 1: Automated Setup
```bash
# Run the automated setup script
run-project.bat
```

### Option 2: Manual Setup

#### 1. Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)

#### 2. Environment Setup
```bash
# Copy environment file
copy backend\env.example backend\.env
```

#### 3. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd "..\Inventory Management System"
npm install
```

#### 4. Database Setup
```bash
# Start MongoDB (in a separate terminal)
mongod

# Seed the database
cd backend
npm run seed
```

#### 5. Start the Application
```bash
# Terminal 1: Start Backend (port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend (port 5173)
cd "Inventory Management System"
npm run dev
```

## Quick Start (macOS/Linux)

### Option 1: Automated Setup
```bash
# Make script executable
chmod +x run-project.sh

# Run the automated setup script
./run-project.sh
```

### Option 2: Manual Setup

#### 1. Prerequisites
```bash
# Install Node.js 18+
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install MongoDB
# macOS
brew install mongodb-community

# Linux (Ubuntu/Debian)
sudo apt-get install mongodb
```

#### 2. Environment Setup
```bash
# Copy environment file
cp backend/env.example backend/.env
```

#### 3. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd "../Inventory Management System"
npm install
```

#### 4. Database Setup
```bash
# Start MongoDB
mongod --fork --logpath /tmp/mongod.log

# Seed the database
cd backend
npm run seed
```

#### 5. Start the Application
```bash
# Terminal 1: Start Backend (port 5000)
cd backend
npm run dev

# Terminal 2: Start Frontend (port 5173)
cd "Inventory Management System"
npm run dev
```

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | aman@medical.com | 12345678 |
| **Inventory Manager** | ben@medical.com | 1234 |
| **Doctor/Nurse** | chloe@medical.com | 1234 |
| **Supplier** | supplybot@medical.com | 1234 |

## 📱 Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🛠️ Troubleshooting

### MongoDB Issues
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB manually
mongod

# Check MongoDB status
mongo --eval "db.adminCommand('ismaster')"
```

### Port Conflicts
```bash
# Check what's using port 5000
netstat -ano | findstr :5000

# Check what's using port 5173
netstat -ano | findstr :5173
```

### Node.js Issues
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Issues
```bash
# Check if .env file exists
ls -la backend/.env

# Verify environment variables
cat backend/.env
```

## 📊 Project Structure

```
Medical Inventory System/
├── backend/                 # Node.js/Express API
│   ├── models/             # Database models
│   ├── routes/             # API endpoints
│   ├── middleware/         # Custom middleware
│   ├── services/           # External services
│   ├── scripts/           # Database seeding
│   └── server.js           # Main server file
├── Inventory Management System/  # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main app component
│   └── package.json
└── run-project.bat        # Windows runner
└── run-project.sh         # Unix runner
```

## 🚀 Development Commands

### Backend Commands
```bash
cd backend

# Development server
npm run dev

# Production server
npm start

# Seed database
npm run seed

# Run tests
npm test
```

### Frontend Commands
```bash
cd "Inventory Management System"

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Backend Configuration (backend/.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medical_inventory
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

### Frontend Configuration
The frontend is configured to connect to the backend API at `http://localhost:5000`.

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Medicine Endpoints
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Order Endpoints
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status

### Request Endpoints
- `GET /api/requests` - Get all requests
- `POST /api/requests` - Create request
- `PUT /api/requests/:id/approve` - Approve request

## 🎯 Features

- **Role-based Access Control**: Admin, Inventory Manager, Doctor, Supplier
- **Medicine Management**: CRUD operations with expiry tracking
- **Order Management**: Purchase orders with supplier integration
- **Request System**: Medicine requests with approval workflow
- **Auto-reorder System**: Intelligent reorder suggestions
- **Activity Logging**: Comprehensive audit trail
- **OpenFDA Integration**: Real-time drug information

## 🆘 Support

If you encounter any issues:

1. **Check the logs** in the terminal output
2. **Verify all prerequisites** are installed
3. **Ensure MongoDB is running**
4. **Check port availability** (5000, 5173)
5. **Verify environment variables** in `.env` file

For additional help, check the individual README files in the backend and frontend directories.

