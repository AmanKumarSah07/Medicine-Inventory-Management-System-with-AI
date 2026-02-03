// models/ActivityLog.js
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const { Schema } = mongoose;

const ActivityLogSchema = new Schema({
  action: { type: String, required: true },
  entityType: { type: String, default: null },
  entityId: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userRole: { type: String, default: null },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  severity: { type: String, enum: ['info','warning','error','critical'], default: 'info' },
  category: { type: String, default: 'general' },
  message: { type: String, default: '' },
  details: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

ActivityLogSchema.plugin(mongoosePaginate);

// Static: findRecent(hours)
ActivityLogSchema.statics.findRecent = function(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ createdAt: { $gte: cutoff } }).sort({ createdAt: -1 }).limit(100);
};

// Static: getActivitySummary(days)
ActivityLogSchema.statics.getActivitySummary = async function(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const total = await this.countDocuments({ createdAt: { $gte: cutoff } });
  const bySeverity = await this.aggregate([
    { $match: { createdAt: { $gte: cutoff } } },
    { $group: { _id: '$severity', count: { $sum: 1 } } }
  ]);

  const byCategory = await this.aggregate([
    { $match: { createdAt: { $gte: cutoff } } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  return { total, bySeverity, byCategory };
};

// Static: cleanOldLogs(daysToKeep) - deletes logs older than daysToKeep
ActivityLogSchema.statics.cleanOldLogs = function(daysToKeep = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  return this.deleteMany({ createdAt: { $lt: cutoff } });
};

// Static: createLog(payload) - convenience wrapper
ActivityLogSchema.statics.createLog = function(payload = {}) {
  // Basic normalization: ensure required fields exist (action)
  if (!payload.action) payload.action = 'unknown';
  return this.create(payload);
};

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
export default ActivityLog;
