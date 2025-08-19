const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { getAllCars, addCar, updateCar, deleteCar } = require('../controllers/carController');
const authMiddleware = require('../middleware/authMiddleware');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Validation middleware
const carValidators = [
  body('name').notEmpty().withMessage('name is required'),
  body('brand').notEmpty().withMessage('brand is required'),
  body('year').isInt({ min: 1886 }).withMessage('year must be valid'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('price must be a positive number'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('mileage must be a positive integer'),
  body('condition').optional().isIn(['New', 'Used']).withMessage('condition must be New or Used'),
  body('features').optional().isArray().withMessage('features must be an array'),
  body('description').optional().isString()
];

// Express-validator error handler
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// Routes
// Get all cars
router.get('/', getAllCars);

// Add car (protected)
router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  carValidators,
  validateRequest,
  addCar
);

// Update car (protected)
router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  carValidators,
  validateRequest,
  updateCar
);

// Delete car (protected)
router.delete(
  '/:id',
  authMiddleware,
  deleteCar
);

module.exports = router;
