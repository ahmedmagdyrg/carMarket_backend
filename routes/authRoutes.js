const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/user');
const Car = require('../models/car');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const getFullImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  return `${req.protocol}://${req.get('host')}${imagePath}`.replace(/([^:]\/)\/+/g, "$1");
};

// Register
router.post('/register', upload.single('avatar'), registerUser);

// Login
router.post('/login', loginUser);

// Forgot/Reset Password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Admin: get single user by id
router.get('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned || false,
      image: getFullImageUrl(req, user.image),
      dateOfBirth: user.dateOfBirth
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned || false,
      image: getFullImageUrl(req, user.image),
      dateOfBirth: user.dateOfBirth
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update my profile (name, email)
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      banned: updated.banned || false,
      image: getFullImageUrl(req, updated.image),
      dateOfBirth: updated.dateOfBirth
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload/update avatar
router.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { image: `/uploads/avatars/${req.file.filename}` },
      { new: true }
    ).select('-password');

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      banned: updated.banned || false,
      image: getFullImageUrl(req, updated.image),
      dateOfBirth: updated.dateOfBirth
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my cars
router.get('/me/cars', authMiddleware, async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const usersWithImage = users.map(u => ({
      ...u.toObject(),
      image: getFullImageUrl(req, u.image),
      banned: u.banned || false
    }));
    res.json(usersWithImage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update user role
router.patch('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      ...user.toObject(),
      image: getFullImageUrl(req, user.image),
      banned: user.banned || false
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: delete user
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: ban user
router.post('/users/:id/ban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.banned = true;
    await user.save();

    res.json({ message: 'User banned successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: unban user
router.post('/users/:id/unban', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.banned = false;
    await user.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin dashboard stats
router.get('/admin/dashboard-stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCars = await Car.countDocuments();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const usersLoggedInToday = await User.countDocuments({
      updatedAt: { $gte: startOfToday }
    });

    const latestCar = await Car.findOne().sort({ createdAt: -1 });

    res.json({
      totalUsers,
      totalCars,
      usersLoggedInToday,
      latestCar: latestCar ? {
        id: latestCar._id,
        name: latestCar.name || latestCar.model || 'Unnamed',
        createdAt: latestCar.createdAt
      } : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
