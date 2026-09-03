import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import {
  errorHandler,
  notFound,
} from "./middlewares/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// ============================================================
// CREATE EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// SERVER LOAD TEST
// ============================================================

console.log("==============================================");
console.log("🔥 LeadMS SERVER.JS LOADED");
console.log("==============================================");

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
  console.log(
    `🔥 REQUEST: ${req.method} ${req.originalUrl}`
  );

  next();
});

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());

app.use(cors());

// ============================================================
// AUTH ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

// ============================================================
// PRODUCT ROUTES
// ============================================================

app.use(
  "/api/products",
  productRoutes
);

// ============================================================
// VENDOR ROUTES
// ============================================================

app.use(
  "/api/vendor",
  vendorRoutes
);

// ============================================================
// LEAD ROUTES
// ============================================================

app.use(
  "/api/leads",
  leadRoutes
);

// ============================================================
// ADMIN ROUTES
// ============================================================

app.use(
  "/api/admin",
  adminRoutes
);

// ============================================================
// HEALTH CHECK / WELCOME ROUTE
// ============================================================

app.get("/", (req, res) => {
  console.log(
    "🔥 HEALTH CHECK REQUEST RECEIVED"
  );

  res.status(200).json({
    message:
      "Welcome to the CRM Backend API. Services are running smoothly.",
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use(notFound);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(errorHandler);

// ============================================================
// PORT
// Render provides PORT in production.
// Local development falls back to 5000.
// ============================================================

const PORT =
  process.env.PORT || 5000;

// ============================================================
// MONGODB CONNECTION
// ============================================================

console.log(
  "Connecting to MongoDB..."
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "✅ MongoDB Connected"
    );
  })
  .catch((error) => {
    console.error(
      "❌ MongoDB connection error:"
    );

    console.error(
      error
    );
  });

// ============================================================
// START EXPRESS SERVER
// ============================================================

app.listen(
  PORT,
  () => {
    console.log(
      "=============================================="
    );

    console.log(
      `🚀 Server running on port ${PORT}`
    );

    console.log(
      "=============================================="
    );
  }
);

// ============================================================
// EXPORT APP
// ============================================================

export default app;