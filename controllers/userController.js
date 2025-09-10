const User = require('../models/user');
const Car = require('../models/car');

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("cars");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      banned: user.banned,
      image: user.image,
      cars: user.cars,
      dateOfBirth: user.dateOfBirth
    });
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

const updateUserRole = async (req, res) => {
  try {
    const { userId, role, masterPassword } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (targetUser.isSuperAdmin) {
      return res.status(403).json({ message: "Cannot change role of Super Admin" });
    }

    if (req.user.isSuperAdmin) {
      if (targetUser.role === "user" && role === "admin") {
        if (!masterPassword || masterPassword !== process.env.MASTER_ADMIN_PASSWORD) {
          return res.status(403).json({ message: "Master password required to promote user to admin" });
        }
      }

      targetUser.role = role;
      await targetUser.save();
      return res.json({ message: "User role updated successfully", user: targetUser });
    }

    if (req.user.role === "admin") {
      if (targetUser.role === "admin") {
        if (!masterPassword || masterPassword !== process.env.MASTER_ADMIN_PASSWORD) {
          return res.status(403).json({ message: "Master password required to update another admin" });
        }
      }

      targetUser.role = role;
      await targetUser.save();
      return res.json({ message: "User role updated successfully", user: targetUser });
    }

    res.status(403).json({ message: "Access denied" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId, masterPassword } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isSuperAdmin) {
      return res.status(403).json({ message: "Cannot delete Super Admin" });
    }

    if (req.user.isSuperAdmin) {
      await User.findByIdAndDelete(userId);
      return res.json({ message: "User deleted successfully" });
    }

    if (req.user.role === "admin") {
      if (!masterPassword || masterPassword !== process.env.MASTER_ADMIN_PASSWORD) {
        return res.status(403).json({ message: "Master password required to delete a user" });
      }
      await User.findByIdAndDelete(userId);
      return res.json({ message: "User deleted successfully" });
    }

    res.status(403).json({ message: "Access denied" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  getMyProfile, 
  updateMyProfile, 
  getMyCars, 
  updateUserRole, 
  deleteUser 
};
