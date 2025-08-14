const Car = require('../models/Car');

// Get all cars
const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add new car
const addCar = async (req, res) => {
  try {
    const { name, brand, year } = req.body;

    // Basic validation (in addition to express-validator in route)
    if (!name || !brand || !year) {
      return res.status(400).json({ message: 'name, brand, and year are required' });
    }

    // Image path from multer if provided
    const imagePath = req.file ? req.file.path : null;

    const newCar = await Car.create({
      name,
      brand,
      year: Number(year),
      image: imagePath
    });

    res.status(201).json(newCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getAllCars, addCar };
