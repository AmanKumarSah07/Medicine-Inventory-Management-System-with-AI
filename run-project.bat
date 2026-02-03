@echo off
echo 🚀 Medical Inventory Management System - Project Runner
echo ====================================================
echo.

echo 📋 Starting the complete project...
echo.

echo 🔧 Step 1: Setting up environment...
if not exist "backend\.env" (
    echo Creating backend .env file...
    copy "backend\env.example" "backend\.env"
    echo ✅ Environment file created
) else (
    echo ✅ Environment file already exists
)

echo.
echo 📦 Step 2: Installing dependencies...
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

echo.
echo Installing frontend dependencies...
cd "..\Inventory Management System"
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend dependency installation failed
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo.
echo 🗄️ Step 3: Database setup...
echo Checking MongoDB configuration...
if not exist "backend\.env" (
    echo Creating .env file from template...
    copy "backend\env.example" "backend\.env"
    echo ✅ Environment file created
    echo.
    echo ⚠️  IMPORTANT: Configure MongoDB Atlas connection in backend\.env
    echo    See MONGODB_ATLAS_SETUP.md for detailed instructions
    echo.
    echo 📋 Quick Atlas Setup:
    echo    1. Go to https://www.mongodb.com/atlas
    echo    2. Create free account and cluster
    echo    3. Get connection string
    echo    4. Update MONGODB_URI in backend\.env
    echo.
    pause
)

echo Seeding database...
cd ..\backend
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Database seeding failed
    pause
    exit /b 1
)
echo ✅ Database seeded successfully

echo.
echo 🚀 Step 4: Starting servers...
echo Starting backend server on port 5000...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend server on port 5173...
start "Frontend Server" cmd /k "cd \"Inventory Management System\" && npm run dev"

echo.
echo 🎉 Project started successfully!
echo.
echo 📱 Access the application:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:5000
echo.
echo 🔑 Default Login Credentials:
echo    Admin: aman@medical.com / 12345678
echo    Inventory: ben@medical.com / 1234
echo    Doctor: chloe@medical.com / 1234
echo    Supplier: supplybot@medical.com / 1234
echo.
echo Press any key to close this window...
pause >nul
