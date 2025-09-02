const User = require('../models/user');
const Car = require('../models/car');

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("cars");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMyCars = async (req, res) => {
  try {
    const cars = await Car.find({ createdBy: req.user.id });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyProfile, updateMyProfile, getMyCars };
