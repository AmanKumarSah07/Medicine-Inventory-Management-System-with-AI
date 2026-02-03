import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    minlength: [2, 'Medicine name must be at least 2 characters'],
    maxlength: [200, 'Medicine name cannot exceed 200 characters']
  },
  genericName: {
    type: String,
    trim: true,
    maxlength: [200, 'Generic name cannot exceed 200 characters']
  },
  brandName: {
    type: String,
    trim: true,
    maxlength: [200, 'Brand name cannot exceed 200 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: {
      values: ['tablets', 'capsules', 'ml', 'mg', 'g', 'units', 'vials', 'bottles'],
      message: 'Unit must be one of: tablets, capsules, ml, mg, g, units, vials, bottles'
    },
    default: 'tablets'
  },
  expiry: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  reorderLevel: {
    type: Number,
    required: [true, 'Reorder level is required'],
    min: [0, 'Reorder level cannot be negative'],
    default: 10
  },
  maxLevel: {
    type: Number,
    min: [0, 'Max level cannot be negative'],
    default: 1000
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative'],
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['antibiotic', 'painkiller', 'vitamin', 'supplement', 'prescription', 'otc', 'emergency', 'other'],
      message: 'Category must be one of: antibiotic, painkiller, vitamin, supplement, prescription, otc, emergency, other'
    },
    default: 'other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  manufacturer: {
    type: String,
    trim: true,
    maxlength: [200, 'Manufacturer name cannot exceed 200 characters']
  },
  batchNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Batch number cannot exceed 50 characters']
  },
  barcode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    maxlength: [50, 'Barcode cannot exceed 50 characters']
  },
  ndc: {
    type: String, // National Drug Code
    trim: true,
    unique: true,
    sparse: true,
    maxlength: [20, 'NDC cannot exceed 20 characters']
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  isControlled: {
    type: Boolean,
    default: false
  },
  storageConditions: {
    temperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    humidity: {
      min: Number,
      max: Number
    },
    lightSensitive: {
      type: Boolean,
      default: false
    }
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastRestocked: {
    type: Date,
    default: null
  },
  lastUsed: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
medicineSchema.index({ name: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ expiry: 1 });
medicineSchema.index({ quantity: 1 });
medicineSchema.index({ isActive: 1 });
medicineSchema.index({ barcode: 1 });
medicineSchema.index({ ndc: 1 });

// Virtual for stock status
medicineSchema.virtual('stockStatus').get(function() {
  if (this.quantity <= 0) return 'out_of_stock';
  if (this.quantity <= this.reorderLevel) return 'low_stock';
  if (this.quantity >= this.maxLevel * 0.9) return 'overstock';
  return 'normal';
});

// Virtual for days until expiry
medicineSchema.virtual('daysUntilExpiry').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiry);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for expiry status
medicineSchema.virtual('expiryStatus').get(function() {
  const days = this.daysUntilExpiry;
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  if (days <= 90) return 'expiring_soon';
  return 'valid';
});

// Static method to find low stock medicines
medicineSchema.statics.findLowStock = function() {
  return this.find({
    $expr: { $lte: ['$quantity', '$reorderLevel'] },
    isActive: true
  });
};

// Static method to find expired medicines
medicineSchema.statics.findExpired = function() {
  return this.find({
    expiry: { $lt: new Date() },
    isActive: true
  });
};

// Static method to find expiring medicines
medicineSchema.statics.findExpiring = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiry: { $lte: futureDate, $gte: new Date() },
    isActive: true
  });
};

// Instance method to update quantity
medicineSchema.methods.updateQuantity = function(newQuantity, reason = 'manual_adjustment') {
  const oldQuantity = this.quantity;
  this.quantity = Math.max(0, newQuantity);
  this.lastRestocked = new Date();
  
  // Log the change
  return this.save().then(() => {
    // Create activity log entry
    return mongoose.model('ActivityLog').create({
      action: 'quantity_updated',
      entityType: 'medicine',
      entityId: this._id,
      details: {
        oldQuantity,
        newQuantity: this.quantity,
        reason
      }
    });
  });
};

// Pre-save middleware to validate data
medicineSchema.pre('save', function(next) {
  // Ensure reorder level is not greater than max level
  if (this.reorderLevel > this.maxLevel) {
    this.reorderLevel = this.maxLevel;
  }
  
  // Ensure quantity doesn't exceed max level
  if (this.quantity > this.maxLevel) {
    this.quantity = this.maxLevel;
  }
  
  next();
});

const Medicine = mongoose.model('Medicine', medicineSchema);

export default Medicine;

