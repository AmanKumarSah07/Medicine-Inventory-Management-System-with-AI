import express from 'express';
import Supplier from '../models/Supplier.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, inventoryOrAdmin, adminOnly } from '../middleware/auth.js';
import { validateSupplier, validateObjectId, validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    isActive, 
    isPreferred,
    specialty,
    search,
    sort = 'name',
    order = 'asc'
  } = req.query;
  
  // Build query
  const query = {};
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  if (isPreferred !== undefined) {
    query.isPreferred = isPreferred === 'true';
  }
  
  if (specialty) {
    query.specialties = { $in: [new RegExp(specialty, 'i')] };
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } },
      { 'contact.phone': { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } }
    ];
  }

  const sortOrder = order === 'desc' ? -1 : 1;
  const sortObj = { [sort]: sortOrder };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sortObj
  };

  const suppliers = await Supplier.paginate(query, options);

  res.json({
    success: true,
    data: suppliers
  });
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  res.json({
    success: true,
    data: { supplier }
  });
});

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (Admin only)
const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);

  // Log supplier creation
  await ActivityLog.createLog({
    action: 'supplier_created',
    entityType: 'supplier',
    entityId: supplier._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `Supplier ${supplier.name} created by ${req.user.name}`,
    details: { 
      name: supplier.name,
      email: supplier.contact.email,
      phone: supplier.contact.phone
    }
  });

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: { supplier }
  });
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin only)
const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  const oldValues = {
    name: supplier.name,
    email: supplier.contact.email,
    phone: supplier.contact.phone,
    isActive: supplier.isActive,
    isPreferred: supplier.isPreferred
  };

  const updatedSupplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  // Log supplier update
  await ActivityLog.createLog({
    action: 'supplier_updated',
    entityType: 'supplier',
    entityId: supplier._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `Supplier ${supplier.name} updated by ${req.user.name}`,
    details: { oldValues, newValues: req.body }
  });

  res.json({
    success: true,
    message: 'Supplier updated successfully',
    data: { supplier: updatedSupplier }
  });
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  // Soft delete
  supplier.isActive = false;
  await supplier.save();

  // Log supplier deletion
  await ActivityLog.createLog({
    action: 'supplier_deleted',
    entityType: 'supplier',
    entityId: supplier._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'warning',
    category: 'users',
    message: `Supplier ${supplier.name} deleted by ${req.user.name}`,
    details: { 
      name: supplier.name,
      email: supplier.contact.email
    }
  });

  res.json({
    success: true,
    message: 'Supplier deleted successfully'
  });
});

// @desc    Get active suppliers
// @route   GET /api/suppliers/active
// @access  Private
const getActiveSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.findActive();

  res.json({
    success: true,
    data: { suppliers }
  });
});

// @desc    Get preferred suppliers
// @route   GET /api/suppliers/preferred
// @access  Private
const getPreferredSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.findPreferred();

  res.json({
    success: true,
    data: { suppliers }
  });
});

// @desc    Get suppliers by specialty
// @route   GET /api/suppliers/specialty/:specialty
// @access  Private
const getSuppliersBySpecialty = asyncHandler(async (req, res) => {
  const { specialty } = req.params;
  const suppliers = await Supplier.findBySpecialty(specialty);

  res.json({
    success: true,
    data: { suppliers }
  });
});

// @desc    Update supplier rating
// @route   PUT /api/suppliers/:id/rating
// @access  Private (Admin only)
const updateSupplierRating = asyncHandler(async (req, res) => {
  const { rating } = req.body;
  
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  const oldRating = supplier.rating;
  await supplier.updateRating(rating);

  // Log rating update
  await ActivityLog.createLog({
    action: 'supplier_rating_updated',
    entityType: 'supplier',
    entityId: supplier._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `Supplier ${supplier.name} rating updated by ${req.user.name}`,
    details: { 
      oldRating, 
      newRating: rating,
      supplier: supplier.name
    }
  });

  res.json({
    success: true,
    message: 'Supplier rating updated successfully',
    data: { 
      supplier: await Supplier.findById(req.params.id),
      oldRating,
      newRating: rating
    }
  });
});

// @desc    Add specialty to supplier
// @route   POST /api/suppliers/:id/specialty
// @access  Private (Admin only)
const addSupplierSpecialty = asyncHandler(async (req, res) => {
  const { specialty } = req.body;
  
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  await supplier.addSpecialty(specialty);

  // Log specialty addition
  await ActivityLog.createLog({
    action: 'supplier_specialty_added',
    entityType: 'supplier',
    entityId: supplier._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `Specialty added to supplier ${supplier.name} by ${req.user.name}`,
    details: { 
      specialty,
      supplier: supplier.name
    }
  });

  res.json({
    success: true,
    message: 'Specialty added successfully',
    data: { supplier: await Supplier.findById(req.params.id) }
  });
});

// @desc    Remove specialty from supplier
// @route   DELETE /api/suppliers/:id/specialty
// @access  Private (Admin only)
const removeSupplierSpecialty = asyncHandler(async (req, res) => {
  const { specialty } = req.body;
  
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  await supplier.removeSpecialty(specialty);

  // Log specialty removal
  await ActivityLog.createLog({
    action: 'supplier_specialty_removed',
    entityType: 'supplier',
    entityId: supplier._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'users',
    message: `Specialty removed from supplier ${supplier.name} by ${req.user.name}`,
    details: { 
      specialty,
      supplier: supplier.name
    }
  });

  res.json({
    success: true,
    message: 'Specialty removed successfully',
    data: { supplier: await Supplier.findById(req.params.id) }
  });
});

// @desc    Get supplier statistics
// @route   GET /api/suppliers/stats
// @access  Private (Admin only)
const getSupplierStats = asyncHandler(async (req, res) => {
  const totalSuppliers = await Supplier.countDocuments();
  const activeSuppliers = await Supplier.countDocuments({ isActive: true });
  const preferredSuppliers = await Supplier.countDocuments({ isPreferred: true });

  const ratingStats = await Supplier.aggregate([
    { $group: { _id: '$rating', count: { $sum: 1 } } }
  ]);

  const specialtyStats = await Supplier.aggregate([
    { $unwind: '$specialties' },
    { $group: { _id: '$specialties', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const monthlyStats = await Supplier.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  res.json({
    success: true,
    data: {
      total: totalSuppliers,
      active: activeSuppliers,
      preferred: preferredSuppliers,
      byRating: ratingStats,
      bySpecialty: specialtyStats,
      monthly: monthlyStats
    }
  });
});

// Routes
router.get('/', authenticate, validateQuery, getSuppliers);
router.get('/stats', authenticate, adminOnly, getSupplierStats);
router.get('/active', authenticate, getActiveSuppliers);
router.get('/preferred', authenticate, getPreferredSuppliers);
router.get('/specialty/:specialty', authenticate, getSuppliersBySpecialty);
router.get('/:id', authenticate, validateObjectId, getSupplier);
router.post('/', authenticate, adminOnly, validateSupplier, createSupplier);
router.put('/:id', authenticate, adminOnly, validateObjectId, updateSupplier);
router.put('/:id/rating', authenticate, adminOnly, validateObjectId, updateSupplierRating);
router.post('/:id/specialty', authenticate, adminOnly, validateObjectId, addSupplierSpecialty);
router.delete('/:id/specialty', authenticate, adminOnly, validateObjectId, removeSupplierSpecialty);
router.delete('/:id', authenticate, adminOnly, validateObjectId, deleteSupplier);

export default router;

