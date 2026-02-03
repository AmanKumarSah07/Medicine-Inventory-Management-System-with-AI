# 🚀 MongoDB Atlas Setup Guide

## Why Use MongoDB Atlas?

- ✅ **No Local Installation** - No need to install MongoDB on your machine
- ✅ **Cloud Hosted** - Access from anywhere
- ✅ **Free Tier Available** - 512MB storage for free
- ✅ **Automatic Backups** - Built-in data protection
- ✅ **Scalable** - Easy to scale as your app grows
- ✅ **Security** - Built-in authentication and encryption

## 📋 Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click **"Try Free"** or **"Get Started Free"**
3. Sign up with your email or use Google/GitHub
4. Verify your email address

### 2. Create a New Cluster

1. **Choose a Cloud Provider**: AWS, Google Cloud, or Azure
2. **Select Region**: Choose closest to your location
3. **Cluster Tier**: Select **M0 Sandbox** (Free tier)
4. **Cluster Name**: `medical-inventory-cluster` (or any name you prefer)
5. Click **"Create Cluster"**

### 3. Create Database User

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `medical-inventory-user` (or your preferred username)
5. **Password**: Generate a secure password (save this!)
6. **Database User Privileges**: Read and write to any database
7. Click **"Add User"**

### 4. Configure Network Access

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. **Add Current IP Address**: Click to add your current IP
4. **Add IP Address**: `0.0.0.0/0` (for development - allows all IPs)
5. Click **"Confirm"**

### 5. Get Connection String

1. Go to **"Clusters"** in the left sidebar
2. Click **"Connect"** on your cluster
3. **Connect your application**: Choose this option
4. **Driver**: Node.js
5. **Version**: 4.1 or later
6. Copy the connection string

### 6. Update Your Environment

1. **Copy the connection string** from Atlas
2. **Replace placeholders** in the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
3. **Update your `.env` file**:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://medical-inventory-user:YOUR_PASSWORD@medical-inventory-cluster.xxxxx.mongodb.net/medical_inventory?retryWrites=true&w=majority
MONGODB_TEST_URI=mongodb+srv://medical-inventory-user:YOUR_PASSWORD@medical-inventory-cluster.xxxxx.mongodb.net/medical_inventory_test?retryWrites=true&w=majority
```

## 🔧 Project Configuration

### Update Backend Environment

1. **Navigate to your project**:
   ```bash
   cd backend
   ```

2. **Edit the .env file**:
   ```bash
   # Windows
   notepad .env
   
   # macOS/Linux
   nano .env
   ```

3. **Update the MongoDB URI** with your Atlas connection string

### Test the Connection

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check the logs** - you should see:
   ```
   MongoDB connected: cluster0.xxxxx.mongodb.net
   Server running on port 5000
   ```

3. **Seed the database**:
   ```bash
   npm run seed
   ```

## 🚀 Running with MongoDB Atlas

### Option 1: Automated Setup (Updated)

The automated scripts will now work with Atlas:

**Windows:**
```bash
run-project.bat
```

**macOS/Linux:**
```bash
chmod +x run-project.sh
./run-project.sh
```

### Option 2: Manual Setup

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd "Inventory Management System"
   npm run dev
   ```

## 🔍 Troubleshooting

### Connection Issues

**Error: "MongoServerError: bad auth"**
- Check username and password in connection string
- Verify database user has correct permissions

**Error: "MongoNetworkError: failed to connect"**
- Check network access settings in Atlas
- Ensure IP address is whitelisted
- Try adding `0.0.0.0/0` for development

**Error: "MongoServerSelectionError"**
- Check cluster status in Atlas dashboard
- Verify connection string format
- Ensure cluster is not paused

### Connection String Format

**Correct Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Common Mistakes:**
- Missing `+srv://` protocol
- Incorrect password encoding
- Missing database name
- Wrong cluster URL

## 📊 Atlas Dashboard Features

### Monitor Your Database

1. **Overview**: See cluster status and metrics
2. **Database**: Browse your collections and documents
3. **Performance**: Monitor query performance
4. **Logs**: View connection and error logs

### Useful Atlas Features

- **Data Explorer**: Browse your data visually
- **Performance Advisor**: Optimize slow queries
- **Real-time Performance**: Monitor live metrics
- **Backups**: Automatic and on-demand backups

## 🔐 Security Best Practices

### For Development
- Use strong passwords
- Whitelist your IP address
- Use environment variables for credentials

### For Production
- Use IP whitelisting (not 0.0.0.0/0)
- Enable encryption at rest
- Use VPC peering for AWS/Azure/GCP
- Regular security audits

## 💰 Cost Considerations

### Free Tier (M0)
- **Storage**: 512MB
- **RAM**: Shared
- **Connections**: 100
- **Perfect for**: Development and testing

### Paid Tiers
- **M2/M5**: $9-25/month
- **M10+**: $57+/month
- **Features**: More storage, dedicated resources, advanced features

## 🎉 Success Indicators

When everything is working:

1. **Backend logs show**: `MongoDB connected: cluster0.xxxxx.mongodb.net`
2. **Database seeding**: `✅ Database seeded successfully`
3. **Frontend loads**: http://localhost:5173
4. **Login works**: Can log in with default credentials
5. **Atlas dashboard**: Shows your collections and data

## 🆘 Need Help?

1. **Check Atlas Status**: https://status.mongodb.com/
2. **Atlas Documentation**: https://docs.atlas.mongodb.com/
3. **Connection String Builder**: Use Atlas dashboard
4. **Community Support**: MongoDB Community Forums

---

**🎯 You're now ready to use MongoDB Atlas with your Medical Inventory Management System!**

