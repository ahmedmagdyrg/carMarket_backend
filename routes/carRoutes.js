const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { 
  getAllCars, 
  getCarById, 
  addCar, 
  updateCar, 
  deleteCar,
  getCarsByUser,
  getUserCars
} = require('../controllers/carController');
const { authMiddleware } = require('../middleware/authMiddleware');

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Validators for create
const createCarValidators = [
  body('make').notEmpty().withMessage('make is required'),
  body('model').notEmpty().withMessage('model is required'),
  body('year').notEmpty().isInt({ min: 1980 }).withMessage('year must be valid'),
  body('price').notEmpty().isFloat({ gt: 0 }).withMessage('price must be a positive number'),
  body('mileage').notEmpty().isInt({ min: 0 }).withMessage('mileage must be a positive integer'),
  body('condition').notEmpty().isIn(['New', 'Used', 'Certified']).withMessage('condition must be New, Used, or Certified'),
  body('features').optional().custom(val => Array.isArray(val) || typeof val === 'string'),
  body('description').optional().isString(),
  body('contactMethod').notEmpty().isString().withMessage('contactMethod is required')
];

// Validators for update
const updateCarValidators = [
  body('make').optional().isString(),
  body('model').optional().isString(),
  body('year').optional().isInt({ min: 1980 }).withMessage('year must be valid'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('price must be a positive number'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('mileage must be a positive integer'),
  body('condition').optional().isIn(['New', 'Used', 'Certified']).withMessage('condition must be New, Used, or Certified'),
  body('features').optional().custom(val => Array.isArray(val) || typeof val === 'string'),
  body('description').optional().isString(),
  body('contactMethod').optional().isString()
];

// Middleware to validate request body
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// Public routes
router.get('/', getAllCars);
router.get('/user/:userId', getCarsByUser); // cars by user
router.get('/:id', getCarById);

// User cars (requires auth)
router.get('/me/cars', authMiddleware, getUserCars);

// Create (requires auth)
router.post(
  '/',
  authMiddleware,
  upload.array('images', 10),
  createCarValidators,
  validateRequest,
  addCar
);

// Update
router.put(
  '/:id',
  authMiddleware,
  upload.array('images', 10),
  updateCarValidators,
  validateRequest,
  updateCar
);

// Delete
router.delete('/:id', authMiddleware, deleteCar);

module.exports = router;
