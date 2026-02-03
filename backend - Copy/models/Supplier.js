import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    minlength: [2, 'Supplier name must be at least 2 characters'],
    maxlength: [200, 'Supplier name cannot exceed 200 characters']
  },
  contact: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State name cannot exceed 100 characters']
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true,
      maxlength: [20, 'ZIP code cannot exceed 20 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters'],
      default: 'United States'
    }
  },
  businessInfo: {
    taxId: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax ID cannot exceed 50 characters']
    },
    licenseNumber: {
      type: String,
      trim: true,
      maxlength: [100, 'License number cannot exceed 100 characters']
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    }
  },
  contactPerson: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    }
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPreferred: {
    type: Boolean,
    default: false
  },
  deliveryTime: {
    average: {
      type: Number, // in days
      min: 0,
      default: 7
    },
    min: {
      type: Number, // in days
      min: 0,
      default: 1
    },
    max: {
      type: Number, // in days
      min: 0,
      default: 14
    }
  },
  paymentTerms: {
    type: String,
    enum: ['net_15', 'net_30', 'net_45', 'net_60', 'cod', 'prepaid'],
    default: 'net_30'
  },
  minimumOrder: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
  },
  specialties: [{
    type: String,
    trim: true,
    maxlength: [100, 'Specialty cannot exceed 100 characters']
  }],
  certifications: [{
    name: {
      type: String,
      trim: true,
      maxlength: [200, 'Certification name cannot exceed 200 characters']
    },
    number: {
      type: String,
      trim: true,
      maxlength: [100, 'Certification number cannot exceed 100 characters']
    },
    expiry: Date
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
supplierSchema.index({ name: 1 });
supplierSchema.index({ 'contact.email': 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ isPreferred: 1 });
supplierSchema.index({ rating: -1 });

// Virtual for full address
supplierSchema.virtual('fullAddress').get(function() {
  const { street, city, state, zipCode, country } = this.address;
  return `${street}, ${city}, ${state} ${zipCode}, ${country}`;
});

// Virtual for contact info
supplierSchema.virtual('primaryContact').get(function() {
  return {
    email: this.contact.email,
    phone: this.contact.phone
  };
});

// Static method to find active suppliers
supplierSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find preferred suppliers
supplierSchema.statics.findPreferred = function() {
  return this.find({ isActive: true, isPreferred: true });
};

// Static method to find suppliers by specialty
supplierSchema.statics.findBySpecialty = function(specialty) {
  return this.find({
    isActive: true,
    specialties: { $in: [new RegExp(specialty, 'i')] }
  });
};

// Instance method to update rating
supplierSchema.methods.updateRating = function(newRating) {
  this.rating = Math.max(0, Math.min(5, newRating));
  return this.save();
};

// Instance method to add specialty
supplierSchema.methods.addSpecialty = function(specialty) {
  if (!this.specialties.includes(specialty)) {
    this.specialties.push(specialty);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove specialty
supplierSchema.methods.removeSpecialty = function(specialty) {
  this.specialties = this.specialties.filter(s => s !== specialty);
  return this.save();
};

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;

