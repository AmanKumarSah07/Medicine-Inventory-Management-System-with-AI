# Medical Inventory Management System - Backend API

A comprehensive backend API for managing medical inventory, orders, requests, and user authentication with role-based access control.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Admin, Inventory Manager, Doctor/Nurse, Supplier roles
- **Medicine Management**: CRUD operations with expiry tracking and low stock alerts
- **Order Management**: Purchase orders with supplier integration
- **Request System**: Medicine requests with approval workflow
- **Auto-reorder System**: Intelligent reorder suggestions with OpenFDA integration
- **Activity Logging**: Comprehensive audit trail
- **OpenFDA Integration**: Real-time drug information from FDA database
- **Security**: Rate limiting, input validation, CORS protection

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator with Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **External API**: OpenFDA API integration

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/medical_inventory

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRE=30d

# External APIs
OPENFDA_API_URL=https://api.fda.gov/drug/label.json

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

```bash
# Start MongoDB (if not running)
mongod

# Seed the database with initial data
npm run seed
```

### 4. Start Development Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📊 Database Seeding

The seeding script creates:

- **4 Users** with different roles
- **2 Suppliers** with contact information
- **5 Sample Medicines** with various categories
- **Activity Logs** for system initialization

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | aman@medical.com | 12345678 |
| Inventory Manager | ben@medical.com | 1234 |
| Doctor/Nurse | chloe@medical.com | 1234 |
| Supplier | supplybot@medical.com | 1234 |

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Create medicine (Inventory/Admin)
- `PUT /api/medicines/:id` - Update medicine (Inventory/Admin)
- `DELETE /api/medicines/:id` - Delete medicine (Inventory/Admin)
- `PUT /api/medicines/:id/quantity` - Update quantity
- `POST /api/medicines/:id/dispense` - Dispense medicine

### Orders
- `GET /api/orders` - Get all orders (Inventory/Admin)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order (Inventory/Admin)
- `PUT /api/orders/:id` - Update order (Inventory/Admin)
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/approve` - Approve order
- `PUT /api/orders/:id/cancel` - Cancel order

### Requests
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get request by ID
- `POST /api/requests` - Create request (Doctor/Admin)
- `PUT /api/requests/:id` - Update request
- `PUT /api/requests/:id/approve` - Approve request (Inventory/Admin)
- `PUT /api/requests/:id/reject` - Reject request (Inventory/Admin)
- `PUT /api/requests/:id/dispense` - Dispense request (Inventory/Admin)

### Reorders
- `GET /api/reorders` - Get all reorders (Inventory/Admin)
- `GET /api/reorders/:id` - Get reorder by ID
- `POST /api/reorders` - Create reorder (Inventory/Admin)
- `PUT /api/reorders/:id` - Update reorder (Inventory/Admin)
- `PUT /api/reorders/:id/approve` - Approve reorder (Inventory/Admin)
- `PUT /api/reorders/:id/reject` - Reject reorder (Inventory/Admin)

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create supplier (Admin only)
- `PUT /api/suppliers/:id` - Update supplier (Admin only)
- `DELETE /api/suppliers/:id` - Delete supplier (Admin only)

### Activity Logs
- `GET /api/logs` - Get all logs (Admin/Inventory)
- `GET /api/logs/:id` - Get log by ID
- `GET /api/logs/stats` - Get log statistics
- `DELETE /api/logs/clean` - Clean old logs (Admin only)

### OpenFDA Integration
- `GET /api/openfda/search/generic` - Search by generic name
- `GET /api/openfda/search/brand` - Search by brand name
- `GET /api/openfda/search/ndc` - Search by NDC
- `GET /api/openfda/drug-info` - Get drug information
- `GET /api/openfda/health` - Check OpenFDA service health

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable origin restrictions
- **Helmet Security**: Security headers
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: bcrypt with configurable rounds
- **JWT Security**: Secure token generation and validation

## 📝 Logging

The system uses Winston for comprehensive logging:

- **Console Logging**: Development environment
- **File Logging**: Production environment
- **Log Levels**: error, warn, info, debug
- **Activity Logs**: User actions and system events

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Production Deployment

### Environment Variables

Set these in your production environment:

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Health Check

```bash
curl http://localhost:5000/health
```

## 🔧 Development

### Project Structure

```
backend/
├── models/           # Database models
├── routes/           # API route handlers
├── middleware/       # Custom middleware
├── services/         # External service integrations
├── scripts/          # Database seeding scripts
├── logs/            # Log files
└── server.js        # Main application file
```

### Adding New Features

1. Create model in `models/`
2. Add routes in `routes/`
3. Update middleware as needed
4. Add tests
5. Update documentation

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check MongoDB is running
mongod --version

# Check connection string
echo $MONGODB_URI
```

**JWT Token Issues**
```bash
# Check JWT secret is set
echo $JWT_SECRET

# Verify token format
# Should be: Bearer <token>
```

**OpenFDA API Issues**
```bash
# Test OpenFDA connectivity
curl "https://api.fda.gov/drug/label.json?limit=1"
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ for Medical Inventory Management**

