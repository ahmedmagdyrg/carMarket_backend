const mongoose = require("mongoose");
const Car = require("../models/car");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid car ID" });
    }
    const car = await Car.findById(id).populate(
      "userId",
      "name email profilePicture"
    );
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const processImages = async (files) => {
  const originals = [];
  const resized = [];

  for (const file of files) {
    // النسخة الأصلية
    const originalPath = path.join("uploads", "originals", `${Date.now()}-${file.originalname}`);
    fs.renameSync(file.path, originalPath); // ننقلها من uploads/ إلى uploads/originals
    originals.push("/" + originalPath.replace(/\\/g, "/"));

    // النسخة المعدلة (بخلفية شفافة)
    const resizedPath = path.join(
      "uploads",
      "resized",
      `resized-${Date.now()}-${file.originalname}.png`
    );
    await sharp(originalPath)
      .resize(800, 600, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(resizedPath);

    resized.push("/" + resizedPath.replace(/\\/g, "/"));
  }

  return { originals, resized };
};

const addCar = async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      price,
      mileage,
      condition,
      features,
      description,
      contactMethod,
    } = req.body;

    if (!make || !model || !year || !condition || !price || !mileage || !contactMethod) {
      return res.status(400).json({
        message:
          "make, model, year, condition, price, mileage, and contactMethod are required",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const { originals, resized } = await processImages(req.files);

    const newCar = await Car.create({
      make,
      model,
      year: Number(year),
      price: Number(price),
      mileage: Number(mileage),
      condition,
      features: features || [],
      description: description || null,
      images: { originals, resized },
      userId: req.user.id,
      contactMethod,
    });

    res.status(201).json(newCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid car ID" });
    }

    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (car.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this car" });
    }

    const {
      make,
      model,
      year,
      price,
      mileage,
      condition,
      features,
      description,
      contactMethod,
    } = req.body;

    const updatedFields = {
      ...(make && { make }),
      ...(model && { model }),
      ...(year && { year: Number(year) }),
      ...(price && { price: Number(price) }),
      ...(mileage && { mileage: Number(mileage) }),
      ...(condition && { condition }),
      ...(features && { features }),
      ...(description && { description }),
      ...(contactMethod && { contactMethod }),
    };

    if (req.files && req.files.length > 0) {
      const { originals, resized } = await processImages(req.files);
      updatedFields.images = { originals, resized };
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updatedFields, {
      new: true,
    });

    res.json(updatedCar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid car ID" });
    }

    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (car.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this car" });
    }

    await car.deleteOne();
    res.json({ message: "Car deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error while deleting car" });
  }
};

const getCarsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const cars = await Car.find({ userId }).sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserCars = async (req, res) => {
  try {
    const userId = req.user.id;
    const cars = await Car.find({ userId }).sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllCars,
  getCarById,
  addCar,
  updateCar,
  deleteCar,
  getCarsByUser,
  getUserCars,
};
