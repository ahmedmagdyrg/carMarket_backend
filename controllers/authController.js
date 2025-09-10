const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

function calculateAge(dateOfBirth) {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, dateOfBirth } = req.body;
    let image = null;

    if (!name || !email || !password || !dateOfBirth) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (calculateAge(dateOfBirth) < 18) {
      return res.status(400).json({ message: 'You must be at least 18 years old to register' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    if (req.file) {
      image = `/uploads/avatars/${req.file.filename}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdminExists = await User.findOne({ isSuperAdmin: true });

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isSuperAdmin: superAdminExists ? false : true,
      dateOfBirth,
      image
    });

    res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        banned: user.banned,
        image: user.image,
        dateOfBirth: user.dateOfBirth
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email }).populate("cars");
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (user.banned) {
      return res.status(403).json({
        message: 'Your account has been banned. Please contact the admin'
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, isSuperAdmin: user.isSuperAdmin, banned: user.banned },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    res.json({
      message: 'User logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        banned: user.banned,
        image: user.image,
        cars: user.cars,
        dateOfBirth: user.dateOfBirth
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If this email exists, a reset link has been sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15;  //15 min = 900000ms احب الدقه 
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"CarSpot" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: ' Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <img src="cid:logo" alt="Car Market Logo" style="width: 120px; margin-bottom: 20px;" />
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #555; font-size: 15px;">
            You requested a password reset. Click the button below to reset your password:
          </p>
          <a href="${resetUrl}" 
             style="display: inline-block; margin-top: 15px; padding: 12px 25px; background-color: #007bff; 
                    color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
          <p style="color: #888; margin-top: 30px; font-size: 12px;">
            If you didn’t request this, you can safely ignore this email.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'icon.png',
        path: 'E:/NTI/car-market - Copy/backend/uploads/icon.png',
          cid: 'logo'
        }
      ]
    });

    res.json({ message: 'If this email exists, a reset link has been sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ message: 'Password is required' });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifySuperAdmin = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    // Check against ENV password (MASTER_ADMIN_PASSWORD)
    if (process.env.MASTER_ADMIN_PASSWORD && password === process.env.MASTER_ADMIN_PASSWORD) {
      return res.json({ success: true });
    }

    // Otherwise, check against super admin in DB
    const superAdmin = await User.findOne({ isSuperAdmin: true });
    if (!superAdmin) {
      return res.status(404).json({ success: false, message: "Super admin not found" });
    }

    const ok = await bcrypt.compare(password, superAdmin.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword, verifySuperAdmin };
