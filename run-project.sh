#!/bin/bash

echo "🚀 Medical Inventory Management System - Project Runner"
echo "===================================================="
echo

echo "📋 Starting the complete project..."
echo

echo "🔧 Step 1: Setting up environment..."
if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env file..."
    cp "backend/env.example" "backend/.env"
    echo "✅ Environment file created"
else
    echo "✅ Environment file already exists"
fi

echo
echo "📦 Step 2: Installing dependencies..."
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi
echo "✅ Backend dependencies installed"

echo
echo "Installing frontend dependencies..."
cd "../Inventory Management System"
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed"
    exit 1
fi
echo "✅ Frontend dependencies installed"

echo
echo "🗄️ Step 3: Database setup..."
echo "Checking MongoDB configuration..."
if [ ! -f "backend/.env" ]; then
    echo "Creating .env file from template..."
    cp "backend/env.example" "backend/.env"
    echo "✅ Environment file created"
    echo
    echo "⚠️  IMPORTANT: Configure MongoDB Atlas connection in backend/.env"
    echo "   See MONGODB_ATLAS_SETUP.md for detailed instructions"
    echo
    echo "📋 Quick Atlas Setup:"
    echo "   1. Go to https://www.mongodb.com/atlas"
    echo "   2. Create free account and cluster"
    echo "   3. Get connection string"
    echo "   4. Update MONGODB_URI in backend/.env"
    echo
    read -p "Press Enter after configuring Atlas connection..."
fi

echo "Seeding database..."
cd ../backend
npm run seed
if [ $? -ne 0 ]; then
    echo "❌ Database seeding failed"
    exit 1
fi
echo "✅ Database seeded successfully"

echo
echo "🚀 Step 4: Starting servers..."
echo "Starting backend server on port 5000..."
cd ../backend
npm run dev &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

echo "Starting frontend server on port 5173..."
cd "../Inventory Management System"
npm run dev &
FRONTEND_PID=$!

echo
echo "🎉 Project started successfully!"
echo
echo "📱 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:5000"
echo
echo "🔑 Default Login Credentials:"
echo "   Admin: aman@medical.com / 12345678"
echo "   Inventory: ben@medical.com / 1234"
echo "   Doctor: chloe@medical.com / 1234"
echo "   Supplier: supplybot@medical.com / 1234"
echo
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "mongod" 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
