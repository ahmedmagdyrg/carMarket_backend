const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    make: { type: String, required: true },     
    model: { type: String, required: true },     
    year: { type: Number, required: true },
    price: { type: Number, required: true },
    mileage: { type: Number, required: true },
    condition: { 
      type: String, 
      enum: ["New", "Used", "Certified"], 
      required: true 
    },
    features: { type: [String], default: [] },
    description: { type: String },
    imageUrl: { type: String, required: true }   
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);
