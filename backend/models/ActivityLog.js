import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    maxlength: [100, 'Action cannot exceed 100 characters']
  },
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: {
      values: ['user', 'medicine', 'order', 'request', 'reorder', 'supplier', 'system'],
      message: 'Entity type must be one of: user, medicine, order, request, reorder, supplier, system'
    }
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  userRole: {
    type: String,
    required: [true, 'User role is required'],
    enum: ['admin', 'inventory', 'doctor', 'supplier']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    trim: true,
    maxlength: [45, 'IP address cannot exceed 45 characters']
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['authentication', 'inventory', 'orders', 'requests', 'users', 'system', 'security'],
      message: 'Category must be one of: authentication, inventory, orders, requests, users, system, security'
    }
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isSystemGenerated: {
    type: Boolean,
    default: false
  },
  sessionId: {
    type: String,
    trim: true,
    maxlength: [100, 'Session ID cannot exceed 100 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ userRole: 1 });
activityLogSchema.index({ category: 1 });
activityLogSchema.index({ severity: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ isSystemGenerated: 1 });

// Compound indexes for common queries
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, severity: 1, createdAt: -1 });

// Virtual for formatted timestamp
activityLogSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual for action description
activityLogSchema.virtual('actionDescription').get(function() {
  const actionDescriptions = {
    'user_login': 'User logged in',
    'user_logout': 'User logged out',
    'user_created': 'User created',
    'user_updated': 'User updated',
    'user_deleted': 'User deleted',
    'medicine_added': 'Medicine added',
    'medicine_updated': 'Medicine updated',
    'medicine_deleted': 'Medicine deleted',
    'medicine_dispensed': 'Medicine dispensed',
    'order_created': 'Order created',
    'order_updated': 'Order updated',
    'order_cancelled': 'Order cancelled',
    'request_created': 'Request created',
    'request_approved': 'Request approved',
    'request_rejected': 'Request rejected',
    'reorder_suggested': 'Reorder suggested',
    'reorder_approved': 'Reorder approved',
    'reorder_rejected': 'Reorder rejected',
    'system_startup': 'System started',
    'system_error': 'System error occurred'
  };
  
  return actionDescriptions[this.action] || this.action;
});

// Static method to find logs by entity
activityLogSchema.statics.findByEntity = function(entityType, entityId) {
  return this.find({ entityType, entityId })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to find logs by user
activityLogSchema.statics.findByUser = function(userId) {
  return this.find({ userId })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to find logs by category
activityLogSchema.statics.findByCategory = function(category) {
  return this.find({ category })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to find logs by severity
activityLogSchema.statics.findBySeverity = function(severity) {
  return this.find({ severity })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to find recent logs
activityLogSchema.statics.findRecent = function(hours = 24) {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);
  
  return this.find({ createdAt: { $gte: cutoffTime } })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to find error logs
activityLogSchema.statics.findErrors = function() {
  return this.find({ 
    severity: { $in: ['error', 'critical'] } 
  })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to find security logs
activityLogSchema.statics.findSecurityLogs = function() {
  return this.find({ 
    category: 'security' 
  })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to get activity summary
activityLogSchema.statics.getActivitySummary = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: cutoffDate } } },
    {
      $group: {
        _id: {
          action: '$action',
          category: '$category'
        },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to find logs by date range
activityLogSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to find logs by IP address
activityLogSchema.statics.findByIP = function(ipAddress) {
  return this.find({ ipAddress })
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });
};

// Static method to clean old logs
activityLogSchema.statics.cleanOldLogs = function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $ne: 'critical' }
  });
};

// Static method to create log entry
activityLogSchema.statics.createLog = function(data) {
  return this.create({
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    userId: data.userId,
    userRole: data.userRole,
    details: data.details || {},
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    severity: data.severity || 'info',
    category: data.category,
    message: data.message,
    oldValues: data.oldValues || {},
    newValues: data.newValues || {},
    metadata: data.metadata || {},
    isSystemGenerated: data.isSystemGenerated || false,
    sessionId: data.sessionId
  });
};

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;

