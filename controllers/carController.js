const Car = require("../models/car");

const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

const addCar = async (req, res) => {
  try {
    const { make, model, year, price, mileage, condition, features, description, contactMethod } = req.body;

    if (!make || !model || !year || !condition || !price || !mileage || !contactMethod) {
      return res.status(400).json({ message: "make, model, year, condition, price, mileage, and contactMethod are required" });
    }

    const imagePaths = req.files ? req.files.map(file => file.path) : [];
    if (imagePaths.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const newCar = await Car.create({
      make,
      model,
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage),
      condition,
      features: features || [],
      description: description || null,
      images: imagePaths,
      userId: req.user.id,
      contactMethod
    });

    res.status(201).json(newCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findById(id);

    if (!car) return res.status(404).json({ message: "Car not found" });

    if (car.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not allowed to update this car" });
    }

    const { make, model, year, price, mileage, condition, features, description, contactMethod } = req.body;

    const updatedFields = {
      ...(make && { make }),
      ...(model && { model }),
      ...(year && { year: Number(year) }),
      ...(price && { price: Number(price) }),
      ...(mileage && { mileage: Number(mileage) }),
      ...(condition && { condition }),
      ...(features && { features }),
      ...(description && { description }),
      ...(contactMethod && { contactMethod })
    };

    if (req.files && req.files.length > 0) {
      updatedFields.images = req.files.map(file => file.path);
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updatedFields, { new: true });

    res.json(updatedCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findById(id);

    if (!car) return res.status(404).json({ message: "Car not found" });

    if (car.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not allowed to delete this car" });
    }

    await car.deleteOne();

    res.json({ message: "Car deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllCars, getCarById, addCar, updateCar, deleteCar };
