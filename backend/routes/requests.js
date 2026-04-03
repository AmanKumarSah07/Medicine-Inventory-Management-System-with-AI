import express from 'express';
import Request from '../models/Request.js';
import Medicine from '../models/Medicine.js';
import Reorder from '../models/Reorder.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, doctorOrAdmin, inventoryOrAdmin } from '../middleware/auth.js';
import { validateRequest, validateObjectId, validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all requests
// @route   GET /api/requests
// @access  Private
const getRequests = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    priority, 
    requester,
    medicine,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;
  
  // Build query
  const query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (priority) {
    query.priority = priority;
  }
  
  if (requester) {
    query.requester = requester;
  }
  
  if (medicine) {
    query.medicine = medicine;
  }

  const sortOrder = order === 'desc' ? -1 : 1;
  const sortObj = { [sort]: sortOrder };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: sortObj,
    populate: 'medicine requester approvedBy dispensedBy'
  };

  const requests = await Request.paginate(query, options);

  res.json({
    success: true,
    data: requests
  });
});

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private
const getRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate('medicine requester approvedBy dispensedBy');
  
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  res.json({
    success: true,
    data: { request }
  });
});

// @desc    Create request
// @route   POST /api/requests
// @access  Private (Doctor/Admin only)
const createRequest = asyncHandler(async (req, res) => {
  const { medicine, quantity, priority, patientInfo, medicalInfo, notes } = req.body;

  // Check if medicine exists and has sufficient stock
  const medicineDoc = await Medicine.findById(medicine);
  if (!medicineDoc) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  if (!medicineDoc.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Medicine is not available'
    });
  }

  const request = await Request.create({
    medicine,
    quantity,
    priority,
    patientInfo,
    medicalInfo,
    notes,
    requester: req.user._id,
    status: 'pending',
    isEmergency: priority === 'emergency'
  });

  // Log request creation
  await ActivityLog.createLog({
    action: 'request_created',
    entityType: 'request',
    entityId: request._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'requests',
    message: `Request ${request.requestNumber} created by ${req.user.name}`,
    details: { 
      requestNumber: request.requestNumber,
      medicine: medicineDoc.name,
      quantity: request.quantity,
      priority: request.priority
    }
  });

  res.status(201).json({
    success: true,
    message: 'Request created successfully',
    data: { request }
  });
});

// @desc    Update request
// @route   PUT /api/requests/:id
// @access  Private
const updateRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  // Only allow updates if request is pending
  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending requests can be updated'
    });
  }

  const oldValues = {
    quantity: request.quantity,
    priority: request.priority,
    patientInfo: request.patientInfo,
    medicalInfo: request.medicalInfo
  };

  const updatedRequest = await Request.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('medicine requester approvedBy dispensedBy');

  // Log request update
  await ActivityLog.createLog({
    action: 'request_updated',
    entityType: 'request',
    entityId: request._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'requests',
    message: `Request ${request.requestNumber} updated by ${req.user.name}`,
    details: { oldValues, newValues: req.body }
  });

  res.json({
    success: true,
    message: 'Request updated successfully',
    data: { request: updatedRequest }
  });
});

// @desc    Approve request
// @route   PUT /api/requests/:id/approve
// @access  Private (Inventory/Admin only)
const approveRequest = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  
  const request = await Request.findById(req.params.id);
  
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending requests can be approved'
    });
  }

  await request.approve(req.user._id, notes);

  // Log request approval
  await ActivityLog.createLog({
    action: 'request_approved',
    entityType: 'request',
    entityId: request._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'requests',
    message: `Request ${request.requestNumber} approved by ${req.user.name}`,
    details: { notes }
  });

  res.json({
    success: true,
    message: 'Request approved successfully',
    data: { request: await Request.findById(req.params.id).populate('medicine requester') }
  });
});

// @desc    Reject request
// @route   PUT /api/requests/:id/reject
// @access  Private (Inventory/Admin only)
const rejectRequest = asyncHandler(async (req, res) => {
  const { reason, notes } = req.body;
  
  const request = await Request.findById(req.params.id);
  
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending requests can be rejected'
    });
  }

  await request.reject(req.user._id, reason, notes);

  // Log request rejection
  await ActivityLog.createLog({
    action: 'request_rejected',
    entityType: 'request',
    entityId: request._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'warning',
    category: 'requests',
    message: `Request ${request.requestNumber} rejected by ${req.user.name}`,
    details: { reason, notes }
  });

  res.json({
    success: true,
    message: 'Request rejected successfully',
    data: { request: await Request.findById(req.params.id).populate('medicine requester') }
  });
});

// @desc    Dispense request
// @route   PUT /api/requests/:id/dispense
// @access  Private (Inventory/Admin only)
const dispenseRequest = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  
  const request = await Request.findById(req.params.id);
  
  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  if (request.status !== 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Only approved requests can be dispensed'
    });
  }

  // Check if medicine has sufficient stock
  const medicine = await Medicine.findById(request.medicine);
  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  if (medicine.quantity < request.quantity) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient stock',
      data: { 
        available: medicine.quantity,
        requested: request.quantity,
        deficit: request.quantity - medicine.quantity
      }
    });
  }

  // Update medicine quantity
  await medicine.updateQuantity(
    medicine.quantity - request.quantity, 
    'dispensed'
  );

  // Update request status
  await request.dispense(req.user._id, notes);

  // Check if medicine needs reorder after dispensing
  if (medicine.quantity <= medicine.reorderLevel) {
    const reorder = await Reorder.create({
      medicine: medicine._id,
      suggestedQuantity: Math.max(request.quantity, medicine.reorderLevel * 2),
      currentQuantity: medicine.quantity,
      reorderLevel: medicine.reorderLevel,
      reason: 'low_stock',
      triggeredBy: req.user._id,
      status: 'pending',
      isAutoGenerated: true
    });

    // Log auto-reorder creation
    await ActivityLog.createLog({
      action: 'reorder_suggested',
      entityType: 'reorder',
      entityId: reorder._id,
      userId: req.user._id,
      userRole: req.user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'info',
      category: 'inventory',
      message: `Auto-reorder suggested for ${medicine.name} after dispensing`,
      details: { 
        medicine: medicine.name,
        suggestedQuantity: reorder.suggestedQuantity,
        currentQuantity: reorder.currentQuantity
      }
    });
  }

  // Log request dispensed
  await ActivityLog.createLog({
    action: 'request_dispensed',
    entityType: 'request',
    entityId: request._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'requests',
    message: `Request ${request.requestNumber} dispensed by ${req.user.name}`,
    details: { 
      medicine: medicine.name,
      quantity: request.quantity,
      notes
    }
  });

  res.json({
    success: true,
    message: 'Request dispensed successfully',
    data: { 
      request: await Request.findById(req.params.id).populate('medicine requester'),
      remainingStock: medicine.quantity - request.quantity
    }
  });
});

// @desc    Get requests by requester
// @route   GET /api/requests/requester/:requesterId
// @access  Private
const getRequestsByRequester = asyncHandler(async (req, res) => {
  const { requesterId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { requester: requesterId };
  
  if (status) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'medicine approvedBy dispensedBy'
  };

  const requests = await Request.paginate(query, options);

  res.json({
    success: true,
    data: requests
  });
});

// @desc    Get emergency requests
// @route   GET /api/requests/emergency
// @access  Private (Inventory/Admin only)
const getEmergencyRequests = asyncHandler(async (req, res) => {
  const requests = await Request.findEmergency().populate('medicine requester');

  res.json({
    success: true,
    data: { requests }
  });
});

// @desc    Get pending requests
// @route   GET /api/requests/pending
// @access  Private (Inventory/Admin only)
const getPendingRequests = asyncHandler(async (req, res) => {
  const requests = await Request.findPending().populate('medicine requester');

  res.json({
    success: true,
    data: { requests }
  });
});

// @desc    Get overdue requests
// @route   GET /api/requests/overdue
// @access  Private (Inventory/Admin only)
const getOverdueRequests = asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const requests = await Request.findOverdue(parseInt(hours)).populate('medicine requester');

  res.json({
    success: true,
    data: { requests }
  });
});

// @desc    Get request statistics
// @route   GET /api/requests/stats
// @access  Private (Inventory/Admin only)
const getRequestStats = asyncHandler(async (req, res) => {
  const totalRequests = await Request.countDocuments();
  const pendingRequests = await Request.countDocuments({ status: 'pending' });
  const approvedRequests = await Request.countDocuments({ status: 'approved' });
  const dispensedRequests = await Request.countDocuments({ status: 'dispensed' });
  const rejectedRequests = await Request.countDocuments({ status: 'rejected' });
  const emergencyRequests = await Request.countDocuments({ isEmergency: true });

  const statusStats = await Request.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const priorityStats = await Request.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  const monthlyStats = await Request.aggregate([
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
      total: totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      dispensed: dispensedRequests,
      rejected: rejectedRequests,
      emergency: emergencyRequests,
      byStatus: statusStats,
      byPriority: priorityStats,
      monthly: monthlyStats
    }
  });
});

// Routes
router.get('/', authenticate, validateQuery, getRequests);
router.get('/stats', authenticate, inventoryOrAdmin, getRequestStats);
router.get('/emergency', authenticate, inventoryOrAdmin, getEmergencyRequests);
router.get('/pending', authenticate, inventoryOrAdmin, getPendingRequests);
router.get('/overdue', authenticate, inventoryOrAdmin, getOverdueRequests);
router.get('/requester/:requesterId', authenticate, validateQuery, getRequestsByRequester);
router.get('/:id', authenticate, validateObjectId, getRequest);
router.post('/', authenticate, doctorOrAdmin, validateRequest, createRequest);
router.put('/:id', authenticate, validateObjectId, updateRequest);
router.put('/:id/approve', authenticate, inventoryOrAdmin, validateObjectId, approveRequest);
router.put('/:id/reject', authenticate, inventoryOrAdmin, validateObjectId, rejectRequest);
router.put('/:id/dispense', authenticate, inventoryOrAdmin, validateObjectId, dispenseRequest);

export default router;

