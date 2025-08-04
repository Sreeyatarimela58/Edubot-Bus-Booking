const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const { protect } = require('../middleware/authMiddleware');

// Import models
const Booking = require("../models/bookingModel");
const User = require("../models/userModel");
const Bus = require("../models/busModel");

// Import controllers
const { addBus, updateBus, deleteBus } = require('../controllers/busController');
const { clearAllBookings } = require('../controllers/bookingController');
const { getAllBookings, getBusesForDate, getBusesForDateRange, getMonthlyBookings, getBusWeeklyStats } = require('../controllers/adminController');

// ✅ GET Dashboard Stats (Real-Time)
router.get("/dashboard-stats", protect, adminMiddleware, async (req, res) => {
  try {
    // Get total number of users (excluding admins)
    const totalUsers = await User.countDocuments({ isAdmin: false });

    // Get total number of buses
    const totalBuses = await Bus.countDocuments();

    // Get total number of bookings
    const totalBookings = await Booking.countDocuments();

    // Get total number of cancelled bookings
    const cancelledBookings = await Booking.countDocuments({ status: "Cancelled" });
    
    // Get total number of pending bookings
    const pendingBookings = await Booking.countDocuments({ status: "Pending" });

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: today }
    });

    // Calculate total revenue
    const bookings = await Booking.find();
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Get recent bookings - try without specifying model first
    let recentBookings;
    try {
      recentBookings = await Booking.find()
        .populate({ path: 'user', select: 'name email' })
        .populate('bus', 'name from to date')
        .sort({ createdAt: -1 })
        .limit(5);
    } catch (populateError) {
      console.error("Error with default populate, trying with explicit model:", populateError.message);
      
      // Try with explicit User model
      recentBookings = await Booking.find()
        .populate({ path: 'user', model: 'User', select: 'name email' })
        .populate('bus', 'name from to date')
        .sort({ createdAt: -1 })
        .limit(5);
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalBuses,
        totalBookings,
        cancelledBookings,
        pendingBookings,
        todayBookings,
        totalRevenue,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
});

// Bus routes
router.post('/buses', protect, adminMiddleware, addBus);
router.put('/buses/:id', protect, adminMiddleware, updateBus);
router.delete('/buses/:id', protect, adminMiddleware, deleteBus);

// Clear all bookings
router.delete('/bookings/clear-all', protect, adminMiddleware, clearAllBookings);

// Get all bookings with optional date filter
router.get('/bookings', protect, adminMiddleware, getAllBookings);

// Get buses running on a specific date
router.get('/buses-by-date', protect, adminMiddleware, getBusesForDate);

// Get buses for a date range (week)
router.get('/buses-for-date-range', protect, adminMiddleware, getBusesForDateRange);

// Get monthly bookings summary
router.get('/monthly-bookings', protect, adminMiddleware, getMonthlyBookings);

// Get weekly booking stats for a specific bus
router.get('/bus-weekly-stats/:busId', protect, adminMiddleware, getBusWeeklyStats);

module.exports = router;
