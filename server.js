  // server.js
  const express = require('express');
  const mongoose = require('mongoose');
  const dotenv = require('dotenv');
  const cors = require('cors');
  const morgan = require('morgan');
  const path = require('path');

  dotenv.config();
  const app = express();

  // Core middlewares
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  // Static folders
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use('/uploads/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

  // Routes
  const carRoutes = require('./routes/carRoutes');
  const authRoutes = require('./routes/authRoutes');

  app.use('/api/cars', carRoutes);
  app.use('/api/auth', authRoutes);

  // DB connection
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
