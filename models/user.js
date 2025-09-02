const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  banned: {          
    type: Boolean,
    default: false
  },

  image: {
    type: String,
    default: null
  },

  dateOfBirth: {
    type: Date,
    required: true
  },

  cars: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car"
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
