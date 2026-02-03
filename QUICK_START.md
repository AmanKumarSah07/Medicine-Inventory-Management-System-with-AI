# 🚀 Medical Inventory Management System - Quick Start

## ✅ Current Status
- ✅ Backend API created and configured
- ✅ Frontend React application ready
- ✅ Dependencies installed
- ⚠️ MongoDB needs to be installed

## 🛠️ Prerequisites Installation

### 1. Install MongoDB

**Windows:**
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. Add MongoDB to your PATH environment variable
4. Start MongoDB service: `net start MongoDB`

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 2. Verify MongoDB Installation
```bash
mongod --version
```

## 🚀 Running the Project

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
# Run the automated setup script
run-project.bat
```

**macOS/Linux:**
```bash
# Make script executable and run
chmod +x run-project.sh
./run-project.sh
```

### Option 2: Manual Setup

#### Step 1: Start MongoDB
```bash
# Start MongoDB in a separate terminal
mongod
```

#### Step 2: Seed the Database
```bash
cd backend
npm run seed
```

#### Step 3: Start Backend Server
```bash
# In a new terminal
cd backend
npm run dev
```

#### Step 4: Start Frontend Server
```bash
# In another new terminal
cd "Inventory Management System"
npm run dev
```

## 📱 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | aman@medical.com | 12345678 |
| **Inventory Manager** | ben@medical.com | 1234 |
| **Doctor/Nurse** | chloe@medical.com | 1234 |
| **Supplier** | supplybot@medical.com | 1234 |

## 🎯 Features Available

### Admin Role
- Manage users (add/remove)
- View system activity logs
- Full system access

### Inventory Manager Role
- Add/remove medicines
- Approve reorder suggestions
- Manage purchase orders
- View activity logs

### Doctor/Nurse Role
- Request medicines
- Instant dispensing if stock available
- View request history

### Supplier Role
- Update order status
- View purchase orders
- Mark orders as shipped/delivered

## 🔧 Troubleshooting

### MongoDB Issues
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service (Windows)
net start MongoDB

# Start MongoDB (macOS/Linux)
brew services start mongodb-community
# or
sudo systemctl start mongodb
```

### Port Conflicts
```bash
# Check what's using port 5000
netstat -ano | findstr :5000

# Check what's using port 5173
netstat -ano | findstr :5173
```

### Environment Issues
```bash
# Verify .env file exists
ls backend/.env

# Check environment variables
type backend\.env
```

## 📊 Project Structure

```
Medical Inventory System/
├── backend/                    # Node.js/Express API
│   ├── models/                # Database models
│   ├── routes/                # API endpoints
│   ├── middleware/            # Authentication & validation
│   ├── services/              # OpenFDA integration
│   ├── scripts/               # Database seeding
│   └── server.js              # Main server file
├── Inventory Management System/ # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   └── App.jsx           # Main app component
│   └── package.json
├── run-project.bat           # Windows runner
├── run-project.sh            # Unix runner
└── SETUP_GUIDE.md            # Detailed setup guide
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **MongoDB**: Running on port 27017
2. **Backend**: Running on http://localhost:5000
3. **Frontend**: Running on http://localhost:5173
4. **Database**: Seeded with sample data
5. **Login**: Can log in with any of the 4 default accounts

## 🆘 Need Help?

1. **Check the logs** in your terminal
2. **Verify MongoDB is running**: `mongod --version`
3. **Check ports are free**: 5000, 5173, 27017
4. **Verify .env file exists**: `backend/.env`
5. **Try the automated scripts**: `run-project.bat` or `./run-project.sh`

## 🚀 Next Steps

Once the application is running:

1. **Login as Admin** (aman@medical.com / 12345678)
2. **Explore the system** - add users, medicines, suppliers
3. **Test different roles** - switch between user types
4. **Try the workflows** - request medicines, approve orders
5. **Check the logs** - view activity logs and system events

The system is now ready for development and testing! 🎉

