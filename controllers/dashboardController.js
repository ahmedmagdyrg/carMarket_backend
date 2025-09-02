// controllers/dashboardController.js
const User = require('../models/user');
const Car = require('../models/car');

const getDashboardStats = async (req, res) => {
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
};

module.exports = { getDashboardStats };
