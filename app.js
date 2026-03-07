const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { errorHandler, notFound } = require("./middlewares/error.middleware");
const logger = require("./utils/logger");

// Route imports
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chatRoutes");
const voiceRoutes = require("./routes/voice.routes");
const weatherRoutes = require("./routes/weather.routes");
const app = express();

// ── Security Middlewares ────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Global rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests from this IP" },
  }),
);

// ── General Middlewares ─────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// HTTP request logger (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ── Health Check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Farmer App API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/voice-chat", voiceRoutes);

// Future routes (placeholder for easy expansion)
// app.use('/api/pest-detection', pestDetectionRoutes);
app.use('/api/weather', weatherRoutes);
// app.use('/api/crops', cropRoutes);

// ── Error Handlers ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
