const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  image: { type: String } // stored path from multer
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
