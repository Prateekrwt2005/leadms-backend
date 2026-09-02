import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);

// Health check / welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the CRM Backend API. Services are running smoothly.'
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Render provides PORT in production.
// Local development falls back to 5000.
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;