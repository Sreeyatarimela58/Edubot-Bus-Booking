const Bus = require("../models/busModel")

// GET: All buses with date filter
exports.getBuses = async (req, res, next) => {
  try {
    const { date } = req.query
    const query = {}

    if (date) {
      // Use exact string match for date to avoid timezone issues
      query.date = date
    }

    const buses = await Bus.find(query).sort({ date: 1, departureTime: 1 })
    res.status(200).json({ success: true, buses })
  } catch (err) {
    console.error("Error fetching buses:", err)
    next(err)
  }
}

// GET: Single bus by ID
exports.getBusById = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id)
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" })
    res.status(200).json({ success: true, bus })
  } catch (err) {
    next(err)
  }
}

// POST: Search buses
exports.searchBuses = async (req, res, next) => {
  try {
    console.log("Search buses request body:", req.body)
    const { from, to, date } = req.body

    // Validate required fields
    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: "From, to, and date are required fields",
        buses: [],
      })
    }

    // Check if the requested date is in the past
    const today = new Date().toISOString().split("T")[0]
    if (date < today) {
      return res.status(400).json({
        success: false,
        message: "Tickets for past dates are not available for booking.",
        buses: [],
      })
    }

    console.log("Search parameters:", { from, to, date })

    // Convert from and to to case-insensitive regex for better matching
    const fromRegex = new RegExp(from, "i")
    const toRegex = new RegExp(to, "i")

    // Find all buses for the route and date using exact string match
    let buses = await Bus.find({
      from: fromRegex,
      to: toRegex,
      date: date, // Exact string match
    }).sort({ departureTime: 1 })

    // If the requested date is today, filter out buses that have already departed
    if (date === today) {
      const currentTime = new Date()
      const currentHour = currentTime.getHours()
      const currentMinute = currentTime.getMinutes()

      buses = buses.filter((bus) => {
        const [departureHours, departureMinutes] = bus.departureTime.split(":").map(Number)
        return departureHours > currentHour || (departureHours === currentHour && departureMinutes > currentMinute)
      })
    }

    console.log("Found buses:", buses.length)
    res.status(200).json({ success: true, buses })
  } catch (err) {
    console.error("Error searching buses:", err)
    next(err)
  }
}



// POST: Add a new bus (admin only)
exports.addBus = async (req, res, next) => {
  try {
    console.log("Add bus request received:", req.body)

    // Create a copy of the request body
    const busData = { ...req.body }

    // Validate that bus number is provided
    if (!busData.number || busData.number.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Bus number is required",
      })
    }

    // Check if bus number already exists
    const existingBus = await Bus.findOne({ number: busData.number.trim() })
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: "Bus number already exists",
      })
    }

    // Ensure required fields have default values
    if (!busData.totalSeats) {
      busData.totalSeats = 40
    }
    if (!busData.type) {
      busData.type = "AC"
    }
    if (!busData.amenities) {
      busData.amenities = []
    }

    console.log("Final bus data before creation:", busData)

    const bus = await Bus.create(busData)
    console.log("Bus created successfully:", bus)
    res.status(201).json({ success: true, bus })
  } catch (err) {
    console.error("Bus creation error:", err)

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      })
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Bus number already exists",
      })
    }

    next(err)
  }
}

// PUT: Update bus by ID
exports.updateBus = async (req, res, next) => {
  try {
    console.log("Update bus request received:", req.body, "Bus ID:", req.params.id)

    const busData = { ...req.body }

    // Remove fields that should not be editable
    delete busData.totalSeats
    delete busData.type

    // Validate that bus number is provided
    if (!busData.number || busData.number.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Bus number is required",
      })
    }

    // Check if bus number already exists (excluding current bus)
    const existingBus = await Bus.findOne({
      number: busData.number.trim(),
      _id: { $ne: req.params.id },
    })
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: "Bus number already exists",
      })
    }

    const bus = await Bus.findByIdAndUpdate(req.params.id, busData, {
      new: true,
      runValidators: true,
    })

    if (!bus) {
      console.log("Bus update failed: Bus not found")
      return res.status(404).json({ success: false, message: "Bus not found" })
    }

    console.log("Bus updated successfully:", bus)
    res.status(200).json({ success: true, bus })
  } catch (err) {
    console.error("Bus update error:", err)

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors,
      })
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Bus number already exists",
      })
    }

    next(err)
  }
}

// DELETE: Remove bus by ID
exports.deleteBus = async (req, res, next) => {
  try {
    console.log("Delete bus request received: Bus ID:", req.params.id)
    
    // Check if there are any bookings for this bus
    const Booking = require("../models/bookingModel")
    const existingBookings = await Booking.find({ bus: req.params.id })
    
    if (existingBookings.length > 0) {
      console.log("Bus deletion failed: Bus has existing bookings")
      return res.status(400).json({ 
        success: false, 
        message: "Cannot delete bus. There are existing bookings for this bus." 
      })
    }
    
    const bus = await Bus.findByIdAndDelete(req.params.id)
    if (!bus) {
      console.log("Bus deletion failed: Bus not found")
      return res.status(404).json({ success: false, message: "Bus not found" })
    }
    console.log("Bus deleted successfully:", bus)
    res.status(200).json({ success: true, message: "Bus deleted successfully" })
  } catch (err) {
    console.error("Bus deletion error:", err)
    next(err)
  }
}
