import express from 'express';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, adminOnly, inventoryOrAdmin } from '../middleware/auth.js';
import { validateUser, validateUserUpdate, validateObjectId, validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, isActive, search } = req.query;
  
  // Build query
  const query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    select: '-password -refreshTokens'
  };

  const users = await User.paginate(query, options);

  res.json({
    success: true,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshTokens');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin only)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, profile } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    profile
  });

  // Log user creation
  await ActivityLog.createLog({
    action: 'user_created',
    entityType: 'user',
    entityId: user._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `User ${user.name} created by ${req.user.name}`,
    details: { email: user.email, role: user.role }
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const oldValues = {
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  // Log user update
  await ActivityLog.createLog({
    action: 'user_updated',
    entityType: 'user',
    entityId: user._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `User ${user.name} updated by ${req.user.name}`,
    details: { oldValues, newValues: req.body }
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  // Log user deletion
  await ActivityLog.createLog({
    action: 'user_deleted',
    entityType: 'user',
    entityId: user._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'warning',
    category: 'users',
    message: `User ${user.name} deleted by ${req.user.name}`,
    details: { email: user.email, role: user.role }
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Deactivate user
// @route   PUT /api/users/:id/deactivate
// @access  Private (Admin only)
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.isActive) {
    return res.status(400).json({
      success: false,
      message: 'User is already deactivated'
    });
  }

  user.isActive = false;
  await user.save();

  // Log user deactivation
  await ActivityLog.createLog({
    action: 'user_deactivated',
    entityType: 'user',
    entityId: user._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'warning',
    category: 'users',
    message: `User ${user.name} deactivated by ${req.user.name}`,
    details: { email: user.email, role: user.role }
  });

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private (Admin only)
const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isActive) {
    return res.status(400).json({
      success: false,
      message: 'User is already active'
    });
  }

  user.isActive = true;
  await user.save();

  // Log user activation
  await ActivityLog.createLog({
    action: 'user_activated',
    entityType: 'user',
    entityId: user._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `User ${user.name} activated by ${req.user.name}`,
    details: { email: user.email, role: user.role }
  });

  res.json({
    success: true,
    message: 'User activated successfully'
  });
});

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private (Admin/Inventory only)
const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const query = { role, isActive: true };
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { name: 1 },
    select: '-password -refreshTokens'
  };

  const users = await User.paginate(query, options);

  res.json({
    success: true,
    data: users
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: ['$isActive', 1, 0] }
        }
      }
    }
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  });

  res.json({
    success: true,
    data: {
      total: totalUsers,
      active: activeUsers,
      recent: recentUsers,
      byRole: stats
    }
  });
});

// Routes
router.get('/', authenticate, adminOnly, validateQuery, getUsers);
router.get('/stats', authenticate, adminOnly, getUserStats);
router.get('/role/:role', authenticate, inventoryOrAdmin, validateQuery, getUsersByRole);
router.get('/:id', authenticate, adminOnly, validateObjectId, getUser);
router.post('/', authenticate, adminOnly, validateUser, createUser);
router.put('/:id', authenticate, adminOnly, validateObjectId, validateUserUpdate, updateUser);
router.delete('/:id', authenticate, adminOnly, validateObjectId, deleteUser);
router.put('/:id/deactivate', authenticate, adminOnly, validateObjectId, deactivateUser);
router.put('/:id/activate', authenticate, adminOnly, validateObjectId, activateUser);

export default router;

