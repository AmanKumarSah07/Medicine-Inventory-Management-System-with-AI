import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
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
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'approved', 'ordered', 'shipped', 'delivered', 'cancelled', 'returned'],
      message: 'Status must be one of: pending, approved, ordered, shipped, delivered, cancelled, returned'
    },
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requested by user is required']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expectedDelivery: {
    type: Date
  },
  actualDelivery: {
    type: Date
  },
  trackingNumber: {
    type: String,
    trim: true,
    maxlength: [100, 'Tracking number cannot exceed 100 characters']
  },
  shippingInfo: {
    carrier: {
      type: String,
      trim: true,
      maxlength: [100, 'Carrier name cannot exceed 100 characters']
    },
    method: {
      type: String,
      trim: true,
      maxlength: [100, 'Shipping method cannot exceed 100 characters']
    },
    cost: {
      type: Number,
      min: [0, 'Shipping cost cannot be negative']
    }
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'check', 'cash', 'other'],
      default: 'bank_transfer'
    },
    terms: {
      type: String,
      enum: ['net_15', 'net_30', 'net_45', 'net_60', 'cod', 'prepaid'],
      default: 'net_30'
    },
    paid: {
      type: Boolean,
      default: false
    },
    paidDate: {
      type: Date
    }
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
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ medicine: 1 });
orderSchema.index({ supplier: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ requestedBy: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ expectedDelivery: 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for days since order
orderSchema.virtual('daysSinceOrder').get(function() {
  const now = new Date();
  const orderDate = new Date(this.createdAt);
  const diffTime = now - orderDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for delivery status
orderSchema.virtual('deliveryStatus').get(function() {
  if (this.status === 'delivered') return 'delivered';
  if (this.status === 'shipped') return 'in_transit';
  if (this.status === 'ordered') return 'processing';
  if (this.status === 'approved') return 'approved';
  if (this.status === 'pending') return 'pending';
  return 'unknown';
});

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('medicine supplier requestedBy');
};

// Static method to find orders by supplier
orderSchema.statics.findBySupplier = function(supplierId) {
  return this.find({ supplier: supplierId }).populate('medicine requestedBy');
};

// Static method to find orders by user
orderSchema.statics.findByUser = function(userId) {
  return this.find({ requestedBy: userId }).populate('medicine supplier');
};

// Static method to find overdue orders
orderSchema.statics.findOverdue = function() {
  const today = new Date();
  return this.find({
    expectedDelivery: { $lt: today },
    status: { $in: ['ordered', 'shipped'] }
  }).populate('medicine supplier requestedBy');
};

// Instance method to update status
orderSchema.methods.updateStatus = function(newStatus, changedBy, reason = '', notes = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to history
  this.history.push({
    status: newStatus,
    changedBy,
    reason,
    notes,
    changedAt: new Date()
  });
  
  // Update delivery date if delivered
  if (newStatus === 'delivered') {
    this.actualDelivery = new Date();
  }
  
  return this.save();
};

// Instance method to add attachment
orderSchema.methods.addAttachment = function(attachment) {
  this.attachments.push(attachment);
  return this.save();
};

// Instance method to remove attachment
orderSchema.methods.removeAttachment = function(attachmentId) {
  this.attachments = this.attachments.filter(att => att._id.toString() !== attachmentId);
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

export default Order;

