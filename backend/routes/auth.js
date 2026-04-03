import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authenticate,
  logAuthAttempt
} from '../middleware/auth.js';
import { validateLogin, validatePassword } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Admin only in production)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, profile } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    profile
  });

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  // Log registration
  await ActivityLog.createLog({
    action: 'user_created',
    entityType: 'user',
    entityId: user._id,
    userId: user._id,
    userRole: user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `User ${user.name} registered successfully`,
    details: { email: user.email, role: user.role }
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      token,
      refreshToken
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists and is active
  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Log failed login attempt
    await ActivityLog.createLog({
      action: 'login_failed',
      entityType: 'user',
      entityId: user._id,
      userId: user._id,
      userRole: user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'warning',
      category: 'authentication',
      message: `Failed login attempt for user ${user.name}`,
      details: { email, reason: 'invalid_password' }
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  await user.updateLastLogin();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  // Log successful login
  await ActivityLog.createLog({
    action: 'user_login',
    entityType: 'user',
    entityId: user._id,
    userId: user._id,
    userRole: user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'authentication',
    message: `User ${user.name} logged in successfully`,
    details: { email, lastLogin: user.lastLogin }
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      token,
      refreshToken
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove refresh token from user
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token: refreshToken } }
    });
  }

  // Log logout
  await ActivityLog.createLog({
    action: 'user_logout',
    entityType: 'user',
    entityId: req.user._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'authentication',
    message: `User ${req.user.name} logged out`,
    details: { email: req.user.email }
  });

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user and check if refresh token exists
    const user = await User.findOne({
      _id: decoded.userId,
      'refreshTokens.token': refreshToken,
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token in database
    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: { token: refreshToken } },
      $push: { refreshTokens: { token: newRefreshToken } }
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshTokens');
  
  res.json({
    success: true,
    data: { user }
  });
});

// @desc    Update current user profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, profile } = req.body;
  const allowedUpdates = ['name', 'profile'];
  const updates = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  // Log profile update
  await ActivityLog.createLog({
    action: 'user_updated',
    entityType: 'user',
    entityId: user._id,
    userId: user._id,
    userRole: user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `User ${user.name} updated their profile`,
    details: { updates }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Log password change
  await ActivityLog.createLog({
    action: 'password_changed',
    entityType: 'user',
    entityId: user._id,
    userId: user._id,
    userRole: user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'security',
    message: `User ${user.name} changed their password`,
    details: { email: user.email }
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Generate reset token (in a real app, you'd send this via email)
  const resetToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Log forgot password request
  await ActivityLog.createLog({
    action: 'password_reset_requested',
    entityType: 'user',
    entityId: user._id,
    userId: user._id,
    userRole: user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'security',
    message: `Password reset requested for user ${user.name}`,
    details: { email: user.email }
  });

  res.json({
    success: true,
    message: 'Password reset instructions sent to your email',
    data: { resetToken } // In production, don't send this in response
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password reset
    await ActivityLog.createLog({
      action: 'password_reset',
      entityType: 'user',
      entityId: user._id,
      userId: user._id,
      userRole: user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'info',
      category: 'security',
      message: `Password reset for user ${user.name}`,
      details: { email: user.email }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }
});

// Routes
router.post('/register', validateLogin, register);
router.post('/login', validateLogin, logAuthAttempt, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.put('/change-password', authenticate, validatePassword, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

