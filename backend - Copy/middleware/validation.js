import { body, param, query, validationResult } from 'express-validator';
import { handleValidationError } from './errorHandler.js';

// Validation result handler
export const handleValidationResults = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors.array()));
  }
  
  next();
};

// User validation rules
export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .isIn(['admin', 'inventory', 'doctor', 'supplier'])
    .withMessage('Role must be one of: admin, inventory, doctor, supplier'),
  
  body('profile.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('profile.department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  
  body('profile.specialization')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Specialization cannot exceed 100 characters'),
  
  handleValidationResults
];

// User update validation rules
export const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['admin', 'inventory', 'doctor', 'supplier'])
    .withMessage('Role must be one of: admin, inventory, doctor, supplier'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  handleValidationResults
];

// Medicine validation rules
export const validateMedicine = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Medicine name must be between 2 and 200 characters'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('unit')
    .isIn(['tablets', 'capsules', 'ml', 'mg', 'g', 'units', 'vials', 'bottles'])
    .withMessage('Unit must be one of: tablets, capsules, ml, mg, g, units, vials, bottles'),
  
  body('expiry')
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  
  body('reorderLevel')
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  
  body('maxLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max level must be a non-negative integer'),
  
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a non-negative number'),
  
  body('category')
    .isIn(['antibiotic', 'painkiller', 'vitamin', 'supplement', 'prescription', 'otc', 'emergency', 'other'])
    .withMessage('Category must be one of: antibiotic, painkiller, vitamin, supplement, prescription, otc, emergency, other'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('manufacturer')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Manufacturer name cannot exceed 200 characters'),
  
  body('barcode')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Barcode cannot exceed 50 characters'),
  
  body('ndc')
    .optional()
    .isLength({ max: 20 })
    .withMessage('NDC cannot exceed 20 characters'),
  
  body('requiresPrescription')
    .optional()
    .isBoolean()
    .withMessage('requiresPrescription must be a boolean value'),
  
  body('isControlled')
    .optional()
    .isBoolean()
    .withMessage('isControlled must be a boolean value'),
  
  handleValidationResults
];

// Medicine update validation rules
export const validateMedicineUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Medicine name must be between 2 and 200 characters'),
  
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('unit')
    .optional()
    .isIn(['tablets', 'capsules', 'ml', 'mg', 'g', 'units', 'vials', 'bottles'])
    .withMessage('Unit must be one of: tablets, capsules, ml, mg, g, units, vials, bottles'),
  
  body('expiry')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  
  body('reorderLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
  
  body('maxLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max level must be a non-negative integer'),
  
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a non-negative number'),
  
  body('category')
    .optional()
    .isIn(['antibiotic', 'painkiller', 'vitamin', 'supplement', 'prescription', 'otc', 'emergency', 'other'])
    .withMessage('Category must be one of: antibiotic, painkiller, vitamin, supplement, prescription, otc, emergency, other'),
  
  handleValidationResults
];

// Order validation rules
export const validateOrder = [
  body('medicine')
    .isMongoId()
    .withMessage('Medicine ID must be a valid MongoDB ObjectId'),
  
  body('supplier')
    .isMongoId()
    .withMessage('Supplier ID must be a valid MongoDB ObjectId'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  
  body('totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a non-negative number'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, normal, high, urgent'),
  
  body('expectedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Expected delivery must be a valid date'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  handleValidationResults
];

// Request validation rules
export const validateRequest = [
  body('medicine')
    .isMongoId()
    .withMessage('Medicine ID must be a valid MongoDB ObjectId'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent', 'emergency'])
    .withMessage('Priority must be one of: low, normal, high, urgent, emergency'),
  
  body('patientInfo.name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Patient name cannot exceed 100 characters'),
  
  body('patientInfo.age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Patient age must be between 0 and 150'),
  
  body('patientInfo.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say'),
  
  body('medicalInfo.diagnosis')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Diagnosis cannot exceed 500 characters'),
  
  body('medicalInfo.prescription')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Prescription cannot exceed 1000 characters'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  handleValidationResults
];

// Reorder validation rules
export const validateReorder = [
  body('medicine')
    .isMongoId()
    .withMessage('Medicine ID must be a valid MongoDB ObjectId'),
  
  body('suggestedQuantity')
    .isInt({ min: 1 })
    .withMessage('Suggested quantity must be a positive integer'),
  
  body('reason')
    .isIn(['low_stock', 'out_of_stock', 'expiring_soon', 'high_demand', 'manual', 'auto'])
    .withMessage('Reason must be one of: low_stock, out_of_stock, expiring_soon, high_demand, manual, auto'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, normal, high, urgent'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  handleValidationResults
];

// Supplier validation rules
export const validateSupplier = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Supplier name must be between 2 and 200 characters'),
  
  body('contact.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('contact.phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('address.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  
  body('address.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('address.state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('address.zipCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('ZIP code must be between 3 and 20 characters'),
  
  body('address.country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  
  body('businessInfo.website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  
  body('businessInfo.description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('deliveryTime.average')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Average delivery time must be a non-negative integer'),
  
  body('paymentTerms')
    .optional()
    .isIn(['net_15', 'net_30', 'net_45', 'net_60', 'cod', 'prepaid'])
    .withMessage('Payment terms must be one of: net_15, net_30, net_45, net_60, cod, prepaid'),
  
  body('minimumOrder')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order must be a non-negative number'),
  
  handleValidationResults
];

// ID parameter validation
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationResults
];

// Query parameter validation
export const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'name', 'quantity', 'expiry'])
    .withMessage('Sort must be one of: createdAt, updatedAt, name, quantity, expiry'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc'),
  
  handleValidationResults
];

// Login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationResults
];

// Password validation
export const validatePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  
  handleValidationResults
];

export default {
  handleValidationResults,
  validateUser,
  validateUserUpdate,
  validateMedicine,
  validateMedicineUpdate,
  validateOrder,
  validateRequest,
  validateReorder,
  validateSupplier,
  validateObjectId,
  validateQuery,
  validateLogin,
  validatePassword
};

