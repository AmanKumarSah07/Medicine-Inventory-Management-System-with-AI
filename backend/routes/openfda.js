import express from 'express';
import openFDAService from '../services/openfdaService.js';
import { authenticate, inventoryOrAdmin } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @desc    Search drugs by generic name
// @route   GET /api/openfda/search/generic
// @access  Private (Inventory/Admin only)
const searchByGenericName = asyncHandler(async (req, res) => {
  const { name, limit = 1 } = req.query;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Generic name is required'
    });
  }

  const drugInfo = await openFDAService.searchByGenericName(name, parseInt(limit));

  res.json({
    success: true,
    data: { drugInfo }
  });
});

// @desc    Search drugs by brand name
// @route   GET /api/openfda/search/brand
// @access  Private (Inventory/Admin only)
const searchByBrandName = asyncHandler(async (req, res) => {
  const { name, limit = 1 } = req.query;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Brand name is required'
    });
  }

  const drugInfo = await openFDAService.searchByBrandName(name, parseInt(limit));

  res.json({
    success: true,
    data: { drugInfo }
  });
});

// @desc    Search drugs by NDC
// @route   GET /api/openfda/search/ndc
// @access  Private (Inventory/Admin only)
const searchByNDC = asyncHandler(async (req, res) => {
  const { ndc, limit = 1 } = req.query;
  
  if (!ndc) {
    return res.status(400).json({
      success: false,
      message: 'NDC is required'
    });
  }

  const drugInfo = await openFDAService.searchByNDC(ndc, parseInt(limit));

  res.json({
    success: true,
    data: { drugInfo }
  });
});

// @desc    Search drugs by manufacturer
// @route   GET /api/openfda/search/manufacturer
// @access  Private (Inventory/Admin only)
const searchByManufacturer = asyncHandler(async (req, res) => {
  const { manufacturer, limit = 1 } = req.query;
  
  if (!manufacturer) {
    return res.status(400).json({
      success: false,
      message: 'Manufacturer is required'
    });
  }

  const drugInfo = await openFDAService.searchByManufacturer(manufacturer, parseInt(limit));

  res.json({
    success: true,
    data: { drugInfo }
  });
});

// @desc    Search drugs by multiple criteria
// @route   POST /api/openfda/search/criteria
// @access  Private (Inventory/Admin only)
const searchByCriteria = asyncHandler(async (req, res) => {
  const { criteria, limit = 1 } = req.body;
  
  if (!criteria || Object.keys(criteria).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one search criteria is required'
    });
  }

  const drugInfo = await openFDAService.searchByCriteria(criteria, parseInt(limit));

  res.json({
    success: true,
    data: { drugInfo }
  });
});

// @desc    Get drug information by medicine name
// @route   GET /api/openfda/drug-info
// @access  Private (Inventory/Admin only)
const getDrugInfo = asyncHandler(async (req, res) => {
  const { medicineName } = req.query;
  
  if (!medicineName) {
    return res.status(400).json({
      success: false,
      message: 'Medicine name is required'
    });
  }

  const drugInfo = await openFDAService.getDrugInfo(medicineName);

  res.json({
    success: true,
    data: { drugInfo }
  });
});

// @desc    Check OpenFDA service health
// @route   GET /api/openfda/health
// @access  Private (Inventory/Admin only)
const checkHealth = asyncHandler(async (req, res) => {
  const isHealthy = await openFDAService.checkHealth();

  res.json({
    success: true,
    data: { 
      healthy: isHealthy,
      service: 'OpenFDA API',
      timestamp: new Date().toISOString()
    }
  });
});

// @desc    Get service statistics
// @route   GET /api/openfda/stats
// @access  Private (Inventory/Admin only)
const getStats = asyncHandler(async (req, res) => {
  const stats = openFDAService.getStats();

  res.json({
    success: true,
    data: { stats }
  });
});

// Routes
router.get('/search/generic', authenticate, inventoryOrAdmin, validateQuery, searchByGenericName);
router.get('/search/brand', authenticate, inventoryOrAdmin, validateQuery, searchByBrandName);
router.get('/search/ndc', authenticate, inventoryOrAdmin, validateQuery, searchByNDC);
router.get('/search/manufacturer', authenticate, inventoryOrAdmin, validateQuery, searchByManufacturer);
router.post('/search/criteria', authenticate, inventoryOrAdmin, searchByCriteria);
router.get('/drug-info', authenticate, inventoryOrAdmin, validateQuery, getDrugInfo);
router.get('/health', authenticate, inventoryOrAdmin, checkHealth);
router.get('/stats', authenticate, inventoryOrAdmin, getStats);

export default router;

