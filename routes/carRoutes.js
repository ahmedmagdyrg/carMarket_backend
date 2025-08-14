const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { getAllCars, addCar } = require('../controllers/carController');
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
  body('year').isInt({ min: 1886 }).withMessage('year must be a valid integer (>=1886)')
];

// Express-validator error handler for this route
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// Routes
router.get('/', getAllCars);

// Protected route: only logged-in users can add a car
router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  carValidators,
  validateRequest,
  addCar
);

module.exports = router;
