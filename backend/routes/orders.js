import express from 'express';
import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticate, inventoryOrAdmin, supplierOrAdmin } from '../middleware/auth.js';
import { validateOrder, validateObjectId, validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Inventory/Admin only)
const getOrders = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    supplier, 
    medicine,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;
  
  // Build query
  const query = {};
  
  if (status) {
    query.status = status;
  }
  
  if (supplier) {
    query.supplier = supplier;
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
    populate: 'medicine supplier requestedBy approvedBy orderedBy'
  };

  const orders = await Order.paginate(query, options);

  res.json({
    success: true,
    data: orders
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('medicine supplier requestedBy approvedBy orderedBy');
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.json({
    success: true,
    data: { order }
  });
});

// @desc    Create order
// @route   POST /api/orders
// @access  Private (Inventory/Admin only)
const createOrder = asyncHandler(async (req, res) => {
  const { medicine, supplier, quantity, unitPrice, priority, expectedDelivery, notes } = req.body;

  // Calculate total price
  const totalPrice = quantity * unitPrice;

  const order = await Order.create({
    medicine,
    supplier,
    quantity,
    unitPrice,
    totalPrice,
    priority,
    expectedDelivery,
    notes,
    requestedBy: req.user._id,
    status: 'pending'
  });

  // Log order creation
  await ActivityLog.createLog({
    action: 'order_created',
    entityType: 'order',
    entityId: order._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'orders',
    message: `Order ${order.orderNumber} created by ${req.user.name}`,
    details: { 
      orderNumber: order.orderNumber,
      medicine: order.medicine,
      supplier: order.supplier,
      quantity: order.quantity,
      totalPrice: order.totalPrice
    }
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private (Inventory/Admin only)
const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const oldValues = {
    status: order.status,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    totalPrice: order.totalPrice
  };

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('medicine supplier requestedBy approvedBy orderedBy');

  // Log order update
  await ActivityLog.createLog({
    action: 'order_updated',
    entityType: 'order',
    entityId: order._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'orders',
    message: `Order ${order.orderNumber} updated by ${req.user.name}`,
    details: { oldValues, newValues: req.body }
  });

  res.json({
    success: true,
    message: 'Order updated successfully',
    data: { order: updatedOrder }
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, reason, notes } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const oldStatus = order.status;
  await order.updateStatus(status, req.user._id, reason, notes);

  // If order is delivered, update medicine quantity
  if (status === 'delivered') {
    const medicine = await Medicine.findById(order.medicine);
    if (medicine) {
      await medicine.updateQuantity(
        medicine.quantity + order.quantity, 
        'order_delivered'
      );
    }
  }

  // Log status update
  await ActivityLog.createLog({
    action: 'order_status_updated',
    entityType: 'order',
    entityId: order._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'orders',
    message: `Order ${order.orderNumber} status updated by ${req.user.name}`,
    details: { 
      oldStatus, 
      newStatus: status,
      reason,
      notes
    }
  });

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { order: await Order.findById(req.params.id).populate('medicine supplier') }
  });
});

// @desc    Approve order
// @route   PUT /api/orders/:id/approve
// @access  Private (Inventory/Admin only)
const approveOrder = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending orders can be approved'
    });
  }

  await order.updateStatus('approved', req.user._id, 'Order approved', notes);

  // Log order approval
  await ActivityLog.createLog({
    action: 'order_approved',
    entityType: 'order',
    entityId: order._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'info',
    category: 'orders',
    message: `Order ${order.orderNumber} approved by ${req.user.name}`,
    details: { notes }
  });

  res.json({
    success: true,
    message: 'Order approved successfully',
    data: { order: await Order.findById(req.params.id).populate('medicine supplier') }
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private (Inventory/Admin only)
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason, notes } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  if (order.status === 'delivered') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel delivered orders'
    });
  }

  await order.updateStatus('cancelled', req.user._id, reason, notes);

  // Log order cancellation
  await ActivityLog.createLog({
    action: 'order_cancelled',
    entityType: 'order',
    entityId: order._id,
    userId: req.user._id,
    userRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    severity: 'warning',
    category: 'orders',
    message: `Order ${order.orderNumber} cancelled by ${req.user.name}`,
    details: { reason, notes }
  });

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order: await Order.findById(req.params.id).populate('medicine supplier') }
  });
});

// @desc    Get orders by supplier
// @route   GET /api/orders/supplier/:supplierId
// @access  Private (Supplier/Admin only)
const getOrdersBySupplier = asyncHandler(async (req, res) => {
  const { supplierId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { supplier: supplierId };
  
  if (status) {
    query.status = status;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'medicine requestedBy'
  };

  const orders = await Order.paginate(query, options);

  res.json({
    success: true,
    data: orders
  });
});

// @desc    Get overdue orders
// @route   GET /api/orders/overdue
// @access  Private (Inventory/Admin only)
const getOverdueOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findOverdue().populate('medicine supplier requestedBy');

  res.json({
    success: true,
    data: { orders }
  });
});

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private (Inventory/Admin only)
const getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const approvedOrders = await Order.countDocuments({ status: 'approved' });
  const shippedOrders = await Order.countDocuments({ status: 'shipped' });
  const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
  const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

  const overdueOrders = await Order.findOverdue();

  const statusStats = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const monthlyStats = await Order.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        totalValue: { $sum: '$totalPrice' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  res.json({
    success: true,
    data: {
      total: totalOrders,
      pending: pendingOrders,
      approved: approvedOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
      overdue: overdueOrders.length,
      byStatus: statusStats,
      monthly: monthlyStats
    }
  });
});

// Routes
router.get('/', authenticate, inventoryOrAdmin, validateQuery, getOrders);
router.get('/stats', authenticate, inventoryOrAdmin, getOrderStats);
router.get('/overdue', authenticate, inventoryOrAdmin, getOverdueOrders);
router.get('/supplier/:supplierId', authenticate, supplierOrAdmin, validateQuery, getOrdersBySupplier);
router.get('/:id', authenticate, validateObjectId, getOrder);
router.post('/', authenticate, inventoryOrAdmin, validateOrder, createOrder);
router.put('/:id', authenticate, inventoryOrAdmin, validateObjectId, updateOrder);
router.put('/:id/status', authenticate, validateObjectId, updateOrderStatus);
router.put('/:id/approve', authenticate, inventoryOrAdmin, validateObjectId, approveOrder);
router.put('/:id/cancel', authenticate, inventoryOrAdmin, validateObjectId, cancelOrder);

export default router;

