require("dotenv").config()
const express = require("express")
const cors = require("cors")
const connectDB = require("./utils/db")
const authRoutes = require("./routes/authRoutes")
const adminAuthRoutes = require("./routes/adminAuthRoutes")
const busRoutes = require("./routes/busRoutes")
const bookingRoutes = require("./routes/bookingRoutes")
const adminRoutes = require("./routes/adminRoutes")
const { errorHandler } = require("./middleware/errorMiddleware")
const { createInitialAdmin } = require("./controllers/adminAuthController")

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET environment variable is not set!")
  console.error("Please create a .env file with JWT_SECRET=yoursecretkey")
  process.exit(1)
}

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is not set!")
  console.error("Please create a .env file with MONGO_URI=your_mongodb_connection_string")
  process.exit(1)
}

// Initialize Express app
const app = express()

// Middleware
app.use(
  cors({
    origin: "*", // for testing only, not production
    credentials: true,
  }),
)
app.use(express.json())

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`)
  next()
})

// Connect to MongoDB
connectDB()

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/admin/auth", adminAuthRoutes)
app.use("/api/buses", busRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/admin", adminRoutes)

// Create initial admin account if none exists
createInitialAdmin()

// Global error handler
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 2000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`Admin login endpoint: http://localhost:${PORT}/api/admin/auth/login`)
})
