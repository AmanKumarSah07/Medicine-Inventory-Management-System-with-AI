import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, inventoryOrAdmin, adminOnly } from '../middleware/auth.js';
import { validateObjectId, validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all activity logs
// @route   GET /api/logs
// @access  Private (Admin/Inventory only)
const getLogs = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    action, 
    entityType, 
    entityId,
    userId,
    category,
    severity,
    startDate,
    endDate,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;
  
  // Build query
  const query = {};
  
  if (action) {
    query.action = action;
  }
  
  if (entityType) {
    query.entityType = entityType;
  }
  
  if (entityId) {
    query.entityId = entityId;
  }
  
  if (userId) {
    query.userId = userId;
  }
  
  if (category) {
    query.category = category;
  }
  
  if (severity) {
    query.severity = severity;
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const sortOrder = order === 'desc' ? -1 : 1;
  const sortObj = { [sort]: sortOrder };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sortObj,
    populate: 'userId',
    select: '-__v'
  };

  const logs = await ActivityLog.paginate(query, options);

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Get single log
// @route   GET /api/logs/:id
// @access  Private (Admin/Inventory only)
const getLog = asyncHandler(async (req, res) => {
  const log = await ActivityLog.findById(req.params.id).populate('userId');
  
  if (!log) {
    return res.status(404).json({
      success: false,
      message: 'Log not found'
    });
  }

  res.json({
    success: true,
    data: { log }
  });
});

// @desc    Get logs by entity
// @route   GET /api/logs/entity/:entityType/:entityId
// @access  Private (Admin/Inventory only)
const getLogsByEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'userId',
    select: '-__v'
  };

  const logs = await ActivityLog.paginate(
    { entityType, entityId },
    options
  );

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Get logs by user
// @route   GET /api/logs/user/:userId
// @access  Private (Admin/Inventory only)
const getLogsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'userId',
    select: '-__v'
  };

  const logs = await ActivityLog.paginate(
    { userId },
    options
  );

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Get logs by category
// @route   GET /api/logs/category/:category
// @access  Private (Admin/Inventory only)
const getLogsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'userId',
    select: '-__v'
  };

  const logs = await ActivityLog.paginate(
    { category },
    options
  );

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Get logs by severity
// @route   GET /api/logs/severity/:severity
// @access  Private (Admin/Inventory only)
const getLogsBySeverity = asyncHandler(async (req, res) => {
  const { severity } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'userId',
    select: '-__v'
  };

  const logs = await ActivityLog.paginate(
    { severity },
    options
  );

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Get recent logs
// @route   GET /api/logs/recent
// @access  Private (Admin/Inventory only)
const getRecentLogs = asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const logs = await ActivityLog.findRecent(parseInt(hours)).populate('userId');

  res.json({
    success: true,
    data: { logs }
  });
});

// @desc    Get error logs
// @route   GET /api/logs/errors
// @access  Private (Admin/Inventory only)
const getErrorLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'userId',
    select: '-__v'
  };

  const logs = await ActivityLog.paginate(
    { severity: { $in: ['error', 'critical'] } },
    options
  );

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Get security logs
// @route   GET /api/logs/security
// @access  Private (Admin only)
const getSecurityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'userId',
    select: '-__v'
  };

  const logs = await ActivityLog.paginate(
    { category: 'security' },
    options
  );

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Get logs by date range
// @route   GET /api/logs/date-range
// @access  Private (Admin/Inventory only)
const getLogsByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 20 } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required'
    });
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'userId',
    select: '-__v'
  };

  const logs = await ActivityLog.paginate(
    {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    },
    options
  );

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Get logs by IP address
// @route   GET /api/logs/ip/:ipAddress
// @access  Private (Admin only)
const getLogsByIP = asyncHandler(async (req, res) => {
  const { ipAddress } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'userId',
    select: '-__v'
  };

  const logs = await ActivityLog.paginate(
    { ipAddress },
    options
  );

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Get activity summary
// @route   GET /api/logs/summary
// @access  Private (Admin/Inventory only)
const getActivitySummary = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const summary = await ActivityLog.getActivitySummary(parseInt(days));

  res.json({
    success: true,
    data: { summary }
  });
});

// @desc    Clean old logs
// @route   DELETE /api/logs/clean
// @access  Private (Admin only)
const cleanOldLogs = asyncHandler(async (req, res) => {
  const { daysToKeep = 90 } = req.body;
  
  const result = await ActivityLog.cleanOldLogs(parseInt(daysToKeep));

  // Log cleanup action
  await ActivityLog.createLog({
    action: 'logs_cleaned',
    entityType: 'system',
    entityId: null,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'system',
    message: `Old logs cleaned by ${req.user.name}`,
    details: { 
      daysToKeep: parseInt(daysToKeep),
      deletedCount: result.deletedCount
    }
  });

  res.json({
    success: true,
    message: 'Old logs cleaned successfully',
    data: { deletedCount: result.deletedCount }
  });
});

// @desc    Get log statistics
// @route   GET /api/logs/stats
// @access  Private (Admin/Inventory only)
const getLogStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  const totalLogs = await ActivityLog.countDocuments();
  const recentLogs = await ActivityLog.countDocuments({
    createdAt: { $gte: cutoffDate }
  });
  const errorLogs = await ActivityLog.countDocuments({
    severity: { $in: ['error', 'critical'] }
  });
  const securityLogs = await ActivityLog.countDocuments({
    category: 'security'
  });

  const actionStats = await ActivityLog.aggregate([
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const categoryStats = await ActivityLog.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const severityStats = await ActivityLog.aggregate([
    { $group: { _id: '$severity', count: { $sum: 1 } } }
  ]);

  const userStats = await ActivityLog.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const dailyStats = await ActivityLog.aggregate([
    {
      $match: { createdAt: { $gte: cutoffDate } }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
    { $limit: 30 }
  ]);

  res.json({
    success: true,
    data: {
      total: totalLogs,
      recent: recentLogs,
      errors: errorLogs,
      security: securityLogs,
      byAction: actionStats,
      byCategory: categoryStats,
      bySeverity: severityStats,
      byUser: userStats,
      daily: dailyStats
    }
  });
});

// Routes
router.get('/', authenticate, inventoryOrAdmin, validateQuery, getLogs);
router.get('/stats', authenticate, inventoryOrAdmin, getLogStats);
router.get('/summary', authenticate, inventoryOrAdmin, getActivitySummary);
router.get('/recent', authenticate, inventoryOrAdmin, getRecentLogs);
router.get('/errors', authenticate, inventoryOrAdmin, getErrorLogs);
router.get('/security', authenticate, adminOnly, getSecurityLogs);
router.get('/date-range', authenticate, inventoryOrAdmin, getLogsByDateRange);
router.get('/entity/:entityType/:entityId', authenticate, inventoryOrAdmin, getLogsByEntity);
router.get('/user/:userId', authenticate, inventoryOrAdmin, getLogsByUser);
router.get('/category/:category', authenticate, inventoryOrAdmin, getLogsByCategory);
router.get('/severity/:severity', authenticate, inventoryOrAdmin, getLogsBySeverity);
router.get('/ip/:ipAddress', authenticate, adminOnly, getLogsByIP);
router.get('/:id', authenticate, inventoryOrAdmin, validateObjectId, getLog);
router.delete('/clean', authenticate, adminOnly, cleanOldLogs);

export default router;

