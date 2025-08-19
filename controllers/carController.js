const Car = require("../models/Car");

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
    const { name, brand, year, price, mileage, condition, features, description } = req.body;

    if (!name || !brand || !year || !condition) {
      return res.status(400).json({ message: "name, brand, year, and condition are required" });
    }

    const imagePath = req.file ? req.file.path : null;

    const newCar = await Car.create({
      name,
      brand,
      year: Number(year),
      price: price || null,
      mileage: mileage || null,
      condition,
      features: features || [],
      description: description || null,
      image: imagePath
    });

    res.status(201).json(newCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update car
const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, year, price, mileage, condition, features, description } = req.body;

    const updatedFields = {
      ...(name && { name }),
      ...(brand && { brand }),
      ...(year && { year: Number(year) }),
      ...(price && { price }),
      ...(mileage && { mileage }),
      ...(condition && { condition }),
      ...(features && { features }),
      ...(description && { description }),
    };

    if (req.file) {
      updatedFields.image = req.file.path;
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedCar) return res.status(404).json({ message: "Car not found" });

    res.json(updatedCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete car
const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCar = await Car.findByIdAndDelete(id);

    if (!deletedCar) return res.status(404).json({ message: "Car not found" });

    res.json({ message: "Car deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllCars, addCar, updateCar, deleteCar };
