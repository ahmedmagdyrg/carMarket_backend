const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifySuperAdmin
} = require('../controllers/authController');
const {
  authMiddleware,
  adminMiddleware
} = require('../middleware/authMiddleware');
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

async function requireMasterPassword(req, res, next) {
  try {
    if (req.user.isSuperAdmin) return next();

    const targetUser = await User.findById(req.params.id || req.body.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const newRole = req.body.role;
    const isChangingToAdmin = newRole === 'admin';

    if (targetUser.role === 'admin' || isChangingToAdmin) {
      const { masterPassword } = req.body;
      if (!masterPassword) {
        return res.status(403).json({ message: 'Master password required' });
      }

      const valid = masterPassword === process.env.MASTER_ADMIN_PASSWORD;
      if (!valid) {
        return res.status(403).json({ message: 'Invalid master password' });
      }
    }

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

router.post('/register', upload.single('avatar'), registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-superadmin', authMiddleware, verifySuperAdmin);

router.get('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.isSuperAdmin) return res.status(404).json({ message: 'User not found' });

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

router.get('/me/cars', authMiddleware, async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({ isSuperAdmin: { $ne: true } }).select('-password');
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

router.patch('/users/:id/role', authMiddleware, adminMiddleware, requireMasterPassword, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findById(req.params.id);
    if (!user || user.isSuperAdmin) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      ...user.toObject(),
      image: getFullImageUrl(req, user.image),
      banned: user.banned || false
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/users/:id', authMiddleware, adminMiddleware, requireMasterPassword, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isSuperAdmin) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/users/:id/ban', authMiddleware, adminMiddleware, requireMasterPassword, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isSuperAdmin) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.banned = true;
    await user.save();

    res.json({ message: 'User banned successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/users/:id/unban', authMiddleware, adminMiddleware, requireMasterPassword, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isSuperAdmin) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.banned = false;
    await user.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/dashboard-stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isSuperAdmin: { $ne: true } });
    const totalCars = await Car.countDocuments();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const usersLoggedInToday = await User.countDocuments({
      updatedAt: { $gte: startOfToday },
      isSuperAdmin: { $ne: true }
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
