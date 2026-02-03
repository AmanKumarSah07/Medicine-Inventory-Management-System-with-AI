@echo off
echo 🚀 Medical Inventory Management System - Status Check
echo ====================================================
echo.

echo 📊 Checking server status...
echo.

echo 🔍 Backend Server (Port 5000):
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running on http://localhost:5000
) else (
    echo ❌ Backend is not responding
)

echo.
echo 🔍 Frontend Server (Port 5173):
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running on http://localhost:5173
) else (
    echo ❌ Frontend is not responding
)

echo.
echo 📱 Access Points:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:5000
echo    Health Check: http://localhost:5000/health
echo.

echo 🔑 Default Login Credentials:
echo    Admin: aman@medical.com / 12345678
echo    Inventory: ben@medical.com / 1234
echo    Doctor: chloe@medical.com / 1234
echo    Supplier: supplybot@medical.com / 1234
echo.

echo Press any key to close...
pause >nul

