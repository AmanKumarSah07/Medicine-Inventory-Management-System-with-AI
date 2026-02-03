import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message
    });
  }
};

// Authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = authorize('admin');

// Inventory manager or admin middleware
export const inventoryOrAdmin = authorize('inventory', 'admin');

// Doctor or admin middleware
export const doctorOrAdmin = authorize('doctor', 'admin');

// Supplier or admin middleware
export const supplierOrAdmin = authorize('supplier', 'admin');

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Don't fail on token errors for optional auth
    next();
  }
};

// Rate limiting for authentication endpoints
export const authRateLimit = (req, res, next) => {
  // This would typically be handled by express-rate-limit middleware
  // but can be customized for auth endpoints
  next();
};

// Log authentication attempts
export const logAuthAttempt = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the authentication attempt
    const logData = {
      action: res.statusCode === 200 ? 'user_login' : 'login_failed',
      entityType: 'user',
      entityId: req.user?._id || null,
      userId: req.user?._id || null,
      userRole: req.user?.role || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: res.statusCode === 200 ? 'info' : 'warning',
      category: 'authentication',
      message: res.statusCode === 200 ? 'User logged in successfully' : 'Login attempt failed',
      details: {
        email: req.body?.email || req.body?.username,
        statusCode: res.statusCode
      }
    };

    // Create log entry asynchronously
    ActivityLog.createLog(logData).catch(err => {
      console.error('Failed to create auth log:', err);
    });

    originalSend.call(this, data);
  };

  next();
};

// Check if user can access resource
export const canAccess = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const permissions = {
      admin: {
        users: ['create', 'read', 'update', 'delete'],
        medicines: ['create', 'read', 'update', 'delete'],
        orders: ['create', 'read', 'update', 'delete'],
        requests: ['create', 'read', 'update', 'delete'],
        reorders: ['create', 'read', 'update', 'delete'],
        suppliers: ['create', 'read', 'update', 'delete'],
        logs: ['read']
      },
      inventory: {
        users: ['read'],
        medicines: ['create', 'read', 'update', 'delete'],
        orders: ['create', 'read', 'update', 'delete'],
        requests: ['read', 'update'],
        reorders: ['create', 'read', 'update', 'delete'],
        suppliers: ['read'],
        logs: ['read']
      },
      doctor: {
        users: ['read'],
        medicines: ['read'],
        orders: ['read'],
        requests: ['create', 'read', 'update'],
        reorders: ['read'],
        suppliers: ['read'],
        logs: []
      },
      supplier: {
        users: ['read'],
        medicines: ['read'],
        orders: ['read', 'update'],
        requests: ['read'],
        reorders: ['read'],
        suppliers: ['read'],
        logs: []
      }
    };

    const userPermissions = permissions[req.user.role];
    
    if (!userPermissions || !userPermissions[resource]) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    if (!userPermissions[resource].includes(action)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Cannot ${action} ${resource}.`
      });
    }

    next();
  };
};

// Check if user owns resource
export const isOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Admin can access everything
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user owns the resource
  const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
  
  if (resourceUserId && resourceUserId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }

  next();
};

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  authenticate,
  authorize,
  adminOnly,
  inventoryOrAdmin,
  doctorOrAdmin,
  supplierOrAdmin,
  optionalAuth,
  authRateLimit,
  logAuthAttempt,
  canAccess,
  isOwner
};

