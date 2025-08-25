const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { 
  getAllCars, 
  getCarById, 
  addCar, 
  updateCar, 
  deleteCar 
} = require('../controllers/carController');
const authMiddleware = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const createCarValidators = [
  body('make').notEmpty().withMessage('make is required'),
  body('model').notEmpty().withMessage('model is required'),
  body('year')
    .notEmpty()
    .withMessage('year is required')
    .isInt({ min: 1886 })
    .withMessage('year must be valid'),
  body('price')
    .notEmpty()
    .withMessage('price is required')
    .isFloat({ gt: 0 })
    .withMessage('price must be a positive number'),
  body('mileage')
    .notEmpty()
    .withMessage('mileage is required')
    .isInt({ min: 0 })
    .withMessage('mileage must be a positive integer'),
  body('condition')
    .notEmpty()
    .withMessage('condition is required')
    .isIn(['New', 'Used', 'Certified'])
    .withMessage('condition must be New, Used, or Certified'),
  body('features').optional().isArray().withMessage('features must be an array'),
  body('description').optional().isString(),
  body('contactMethod')
    .notEmpty()
    .withMessage('contactMethod is required')
    .isString()
];

const updateCarValidators = [
  body('make').optional().isString(),
  body('model').optional().isString(),
  body('year').optional().isInt({ min: 1886 }).withMessage('year must be valid'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('price must be a positive number'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('mileage must be a positive integer'),
  body('condition').optional().isIn(['New', 'Used', 'Certified']).withMessage('condition must be New, Used, or Certified'),
  body('features').optional().isArray().withMessage('features must be an array'),
  body('description').optional().isString(),
  body('contactMethod').optional().isString()
];

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

router.get('/', getAllCars);
router.get('/:id', getCarById);

router.post(
  '/',
  authMiddleware,
  upload.array('images', 10),
  createCarValidators,
  validateRequest,
  addCar
);

router.put(
  '/:id',
  authMiddleware,
  upload.array('images', 10),
  updateCarValidators,
  validateRequest,
  updateCar
);

router.delete('/:id', authMiddleware, deleteCar);

module.exports = router;
