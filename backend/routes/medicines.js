import express from 'express';
import Medicine from '../models/Medicine.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, inventoryOrAdmin, doctorOrAdmin } from '../middleware/auth.js';
import { validateMedicine, validateMedicineUpdate, validateObjectId, validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Private
const getMedicines = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    category, 
    search, 
    lowStock, 
    expired, 
    expiring,
    sort = 'name',
    order = 'asc'
  } = req.query;
  
  // Build query
  const query = { isActive: true };
  
  if (category) {
    query.category = category;
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { brandName: { $regex: search, $options: 'i' } },
      { manufacturer: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (lowStock === 'true') {
    query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
  }
  
  if (expired === 'true') {
    query.expiry = { $lt: new Date() };
  }
  
  if (expiring === 'true') {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    query.expiry = { $lte: thirtyDaysFromNow, $gte: new Date() };
  }

  const sortOrder = order === 'desc' ? -1 : 1;
  const sortObj = { [sort]: sortOrder };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sortObj,
    populate: 'supplier'
  };

  const medicines = await Medicine.paginate(query, options);

  res.json({
    success: true,
    data: medicines
  });
});

// @desc    Get single medicine
// @route   GET /api/medicines/:id
// @access  Private
const getMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id).populate('supplier');
  
  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  res.json({
    success: true,
    data: { medicine }
  });
});

// @desc    Create medicine
// @route   POST /api/medicines
// @access  Private (Inventory/Admin only)
const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.create(req.body);

  // Log medicine creation
  await ActivityLog.createLog({
    action: 'medicine_added',
    entityType: 'medicine',
    entityId: medicine._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'inventory',
    message: `Medicine ${medicine.name} added by ${req.user.name}`,
    details: { 
      name: medicine.name, 
      quantity: medicine.quantity,
      category: medicine.category 
    }
  });

  res.status(201).json({
    success: true,
    message: 'Medicine created successfully',
    data: { medicine }
  });
});

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private (Inventory/Admin only)
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  
  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  const oldValues = {
    name: medicine.name,
    quantity: medicine.quantity,
    expiry: medicine.expiry,
    reorderLevel: medicine.reorderLevel
  };

  const updatedMedicine = await Medicine.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('supplier');

  // Log medicine update
  await ActivityLog.createLog({
    action: 'medicine_updated',
    entityType: 'medicine',
    entityId: medicine._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'inventory',
    message: `Medicine ${medicine.name} updated by ${req.user.name}`,
    details: { oldValues, newValues: req.body }
  });

  res.json({
    success: true,
    message: 'Medicine updated successfully',
    data: { medicine: updatedMedicine }
  });
});

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private (Inventory/Admin only)
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  
  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  // Soft delete
  medicine.isActive = false;
  await medicine.save();

  // Log medicine deletion
  await ActivityLog.createLog({
    action: 'medicine_deleted',
    entityType: 'medicine',
    entityId: medicine._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'warning',
    category: 'inventory',
    message: `Medicine ${medicine.name} deleted by ${req.user.name}`,
    details: { 
      name: medicine.name, 
      quantity: medicine.quantity,
      category: medicine.category 
    }
  });

  res.json({
    success: true,
    message: 'Medicine deleted successfully'
  });
});

// @desc    Update medicine quantity
// @route   PUT /api/medicines/:id/quantity
// @access  Private (Inventory/Admin only)
const updateQuantity = asyncHandler(async (req, res) => {
  const { quantity, reason = 'manual_adjustment' } = req.body;
  
  const medicine = await Medicine.findById(req.params.id);
  
  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  const oldQuantity = medicine.quantity;
  await medicine.updateQuantity(quantity, reason);

  // Log quantity update
  await ActivityLog.createLog({
    action: 'quantity_updated',
    entityType: 'medicine',
    entityId: medicine._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'inventory',
    message: `Medicine ${medicine.name} quantity updated by ${req.user.name}`,
    details: { 
      oldQuantity, 
      newQuantity: quantity,
      reason,
      medicine: medicine.name
    }
  });

  res.json({
    success: true,
    message: 'Quantity updated successfully',
    data: { 
      medicine: await Medicine.findById(req.params.id),
      oldQuantity,
      newQuantity: quantity
    }
  });
});

// @desc    Dispense medicine
// @route   POST /api/medicines/:id/dispense
// @access  Private (Doctor/Admin only)
const dispenseMedicine = asyncHandler(async (req, res) => {
  const { quantity, patientInfo, medicalInfo } = req.body;
  
  const medicine = await Medicine.findById(req.params.id);
  
  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  if (medicine.quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient stock',
      data: { 
        available: medicine.quantity,
        requested: quantity,
        deficit: quantity - medicine.quantity
      }
    });
  }

  const oldQuantity = medicine.quantity;
  await medicine.updateQuantity(medicine.quantity - quantity, 'dispensed');

  // Log medicine dispensed
  await ActivityLog.createLog({
    action: 'medicine_dispensed',
    entityType: 'medicine',
    entityId: medicine._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'inventory',
    message: `Medicine ${medicine.name} dispensed by ${req.user.name}`,
    details: { 
      quantity,
      patientInfo,
      medicalInfo,
      medicine: medicine.name,
      oldQuantity,
      newQuantity: medicine.quantity - quantity
    }
  });

  res.json({
    success: true,
    message: 'Medicine dispensed successfully',
    data: { 
      medicine: await Medicine.findById(req.params.id),
      dispensedQuantity: quantity,
      remainingQuantity: medicine.quantity - quantity
    }
  });
});

// @desc    Get low stock medicines
// @route   GET /api/medicines/low-stock
// @access  Private (Inventory/Admin only)
const getLowStockMedicines = asyncHandler(async (req, res) => {
  const medicines = await Medicine.findLowStock().populate('supplier');

  res.json({
    success: true,
    data: { medicines }
  });
});

// @desc    Get expired medicines
// @route   GET /api/medicines/expired
// @access  Private (Inventory/Admin only)
const getExpiredMedicines = asyncHandler(async (req, res) => {
  const medicines = await Medicine.findExpired().populate('supplier');

  res.json({
    success: true,
    data: { medicines }
  });
});

// @desc    Get expiring medicines
// @route   GET /api/medicines/expiring
// @access  Private (Inventory/Admin only)
const getExpiringMedicines = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const medicines = await Medicine.findExpiring(parseInt(days)).populate('supplier');

  res.json({
    success: true,
    data: { medicines }
  });
});

// @desc    Get medicine statistics
// @route   GET /api/medicines/stats
// @access  Private (Inventory/Admin only)
const getMedicineStats = asyncHandler(async (req, res) => {
  const totalMedicines = await Medicine.countDocuments({ isActive: true });
  const lowStockCount = await Medicine.countDocuments({
    $expr: { $lte: ['$quantity', '$reorderLevel'] },
    isActive: true
  });
  const expiredCount = await Medicine.countDocuments({
    expiry: { $lt: new Date() },
    isActive: true
  });
  const expiringCount = await Medicine.countDocuments({
    expiry: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gte: new Date() },
    isActive: true
  });

  const categoryStats = await Medicine.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: {
      total: totalMedicines,
      lowStock: lowStockCount,
      expired: expiredCount,
      expiring: expiringCount,
      byCategory: categoryStats
    }
  });
});

// Routes
router.get('/', authenticate, validateQuery, getMedicines);
router.get('/stats', authenticate, inventoryOrAdmin, getMedicineStats);
router.get('/low-stock', authenticate, inventoryOrAdmin, getLowStockMedicines);
router.get('/expired', authenticate, inventoryOrAdmin, getExpiredMedicines);
router.get('/expiring', authenticate, inventoryOrAdmin, getExpiringMedicines);
router.get('/:id', authenticate, validateObjectId, getMedicine);
router.post('/', authenticate, inventoryOrAdmin, validateMedicine, createMedicine);
router.put('/:id', authenticate, inventoryOrAdmin, validateObjectId, validateMedicineUpdate, updateMedicine);
router.put('/:id/quantity', authenticate, inventoryOrAdmin, validateObjectId, updateQuantity);
router.post('/:id/dispense', authenticate, doctorOrAdmin, validateObjectId, dispenseMedicine);
router.delete('/:id', authenticate, inventoryOrAdmin, validateObjectId, deleteMedicine);

export default router;

