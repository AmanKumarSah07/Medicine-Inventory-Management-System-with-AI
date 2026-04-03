import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine is required']
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'approved', 'dispensed', 'rejected', 'cancelled'],
      message: 'Status must be one of: pending, approved, dispensed, rejected, cancelled'
    },
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent', 'emergency'],
    default: 'normal'
  },
  patientInfo: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Patient name cannot exceed 100 characters']
    },
    id: {
      type: String,
      trim: true,
      maxlength: [50, 'Patient ID cannot exceed 50 characters']
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    }
  },
  medicalInfo: {
    diagnosis: {
      type: String,
      trim: true,
      maxlength: [500, 'Diagnosis cannot exceed 500 characters']
    },
    prescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Prescription cannot exceed 1000 characters']
    },
    dosage: {
      type: String,
      trim: true,
      maxlength: [200, 'Dosage cannot exceed 200 characters']
    },
    frequency: {
      type: String,
      trim: true,
      maxlength: [200, 'Frequency cannot exceed 200 characters']
    },
    duration: {
      type: String,
      trim: true,
      maxlength: [200, 'Duration cannot exceed 200 characters']
    }
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dispensedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  dispensedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  history: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
  }],
  isEmergency: {
    type: Boolean,
    default: false
  },
  requiresApproval: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
requestSchema.index({ requestNumber: 1 });
requestSchema.index({ medicine: 1 });
requestSchema.index({ requester: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ priority: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ isEmergency: 1 });

// Pre-save middleware to generate request number
requestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestNumber) {
    const count = await mongoose.model('Request').countDocuments();
    this.requestNumber = `REQ-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for days since request
requestSchema.virtual('daysSinceRequest').get(function() {
  const now = new Date();
  const requestDate = new Date(this.createdAt);
  const diffTime = now - requestDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for processing time
requestSchema.virtual('processingTime').get(function() {
  if (this.dispensedAt) {
    const requestDate = new Date(this.createdAt);
    const dispensedDate = new Date(this.dispensedAt);
    const diffTime = dispensedDate - requestDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Static method to find requests by status
requestSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('medicine requester approvedBy dispensedBy');
};

// Static method to find requests by requester
requestSchema.statics.findByRequester = function(requesterId) {
  return this.find({ requester: requesterId }).populate('medicine approvedBy dispensedBy');
};

// Static method to find emergency requests
requestSchema.statics.findEmergency = function() {
  return this.find({ 
    $or: [
      { isEmergency: true },
      { priority: 'emergency' }
    ]
  }).populate('medicine requester');
};

// Static method to find pending requests
requestSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).populate('medicine requester');
};

// Static method to find overdue requests
requestSchema.statics.findOverdue = function(hours = 24) {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);
  
  return this.find({
    status: 'pending',
    createdAt: { $lt: cutoffTime }
  }).populate('medicine requester');
};

// Instance method to approve request
requestSchema.methods.approve = function(approvedBy, notes = '') {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  
  this.history.push({
    status: 'approved',
    changedBy: approvedBy,
    reason: 'Request approved',
    notes,
    changedAt: new Date()
  });
  
  return this.save();
};

// Instance method to dispense request
requestSchema.methods.dispense = function(dispensedBy, notes = '') {
  this.status = 'dispensed';
  this.dispensedBy = dispensedBy;
  this.dispensedAt = new Date();
  
  this.history.push({
    status: 'dispensed',
    changedBy: dispensedBy,
    reason: 'Medicine dispensed',
    notes,
    changedAt: new Date()
  });
  
  return this.save();
};

// Instance method to reject request
requestSchema.methods.reject = function(rejectedBy, reason, notes = '') {
  this.status = 'rejected';
  this.rejectionReason = reason;
  
  this.history.push({
    status: 'rejected',
    changedBy: rejectedBy,
    reason,
    notes,
    changedAt: new Date()
  });
  
  return this.save();
};

// Instance method to update status
requestSchema.methods.updateStatus = function(newStatus, changedBy, reason = '', notes = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Update specific fields based on status
  if (newStatus === 'approved') {
    this.approvedBy = changedBy;
    this.approvedAt = new Date();
  } else if (newStatus === 'dispensed') {
    this.dispensedBy = changedBy;
    this.dispensedAt = new Date();
  }
  
  this.history.push({
    status: newStatus,
    changedBy,
    reason,
    notes,
    changedAt: new Date()
  });
  
  return this.save();
};

const Request = mongoose.model('Request', requestSchema);

export default Request;

