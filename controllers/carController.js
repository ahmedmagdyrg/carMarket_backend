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

// Get single car by ID
const getCarById = async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findById(id);

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add new car
const addCar = async (req, res) => {
  try {
    const { make, model, year, price, mileage, condition, features, description } = req.body;

    // Required fields check
    if (!make || !model || !year || !condition || !price || !mileage) {
      return res.status(400).json({ message: "make, model, year, condition, price, and mileage are required" });
    }

    // Image check
    const imagePath = req.file ? req.file.path : null;
    if (!imagePath) {
      return res.status(400).json({ message: "Image is required" });
    }

    // Create new car
    const newCar = await Car.create({
      make,
      model,
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage),
      condition,
      features: features || [],
      description: description || null,
      imageUrl: imagePath
    });

    res.status(201).json(newCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update car by ID
const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, year, price, mileage, condition, features, description } = req.body;

    // Build updated fields object
    const updatedFields = {
      ...(make && { make }),
      ...(model && { model }),
      ...(year && { year: Number(year) }),
      ...(price && { price: Number(price) }),
      ...(mileage && { mileage: Number(mileage) }),
      ...(condition && { condition }),
      ...(features && { features }),
      ...(description && { description }),
    };

    // Update image if provided
    if (req.file) {
      updatedFields.imageUrl = req.file.path;
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedCar) return res.status(404).json({ message: "Car not found" });

    res.json(updatedCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete car by ID
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

module.exports = { getAllCars, getCarById, addCar, updateCar, deleteCar };
