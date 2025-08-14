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

// Static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const carRoutes = require('./routes/carRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/cars', carRoutes);
app.use('/api/auth', authRoutes);

// DB connection
mongoose.connect(process.env.MONGO_URI, {
  // modern mongoose no longer needs these flags, but they are harmless:
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
