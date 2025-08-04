const Booking = require("../models/bookingModel")
const Bus = require("../models/busModel")

// POST: Book one or more seats
exports.bookSeats = async (req, res, next) => {
  try {
    console.log("Booking request received:", req.body)
    console.log(
      "User from token:",
      req.user ? { _id: req.user._id, name: req.user.name, email: req.user.email } : "No user",
    )

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required. Please login." })
    }

    const { busId, seatsBooked, seats: seatsFromRequest, paymentMethod = "Credit Card", paymentStatus = "Completed" } = req.body
    const seats = seatsBooked || seatsFromRequest || []; // For backward compatibility with both parameter names

    // Validate input
    if (!busId || !Array.isArray(seats) || seats.length === 0) {
      console.log("Booking failed: Missing busId or seats")
      return res.status(400).json({ success: false, message: "Bus ID and seats are required" })
    }

    // Validate that seats are valid numbers
    if (!seats.every((seat) => typeof seat === "number" && seat > 0)) {
      console.log("Booking failed: Invalid seat numbers")
      return res.status(400).json({ success: false, message: "Invalid seat numbers. Seats must be positive numbers." })
    }

    // Find the bus
    const bus = await Bus.findById(busId)
    if (!bus) {
      console.log("Booking failed: Bus not found")
      return res.status(404).json({ success: false, message: "Bus not found" })
    }

    // Check if the bus date is in the past
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    const busDate = new Date(bus.date)
    busDate.setHours(0, 0, 0, 0)

    if (busDate < currentDate) {
      console.log("Booking failed: Cannot book tickets for past dates")
      return res.status(400).json({ success: false, message: "Tickets for past dates are not available for booking" })
    }
    
    // Check if booking time is after or equal to departure time
    const currentTime = new Date()
    const [departureHours, departureMinutes] = bus.departureTime.split(":").map(Number)
    const departureDateTime = new Date(bus.date)
    departureDateTime.setHours(departureHours, departureMinutes, 0, 0)
    
    if (currentTime >= departureDateTime) {
      console.log("Booking failed: Cannot book tickets after departure time")
      return res.status(400).json({ success: false, message: "Cannot book tickets after departure time" })
    }

    // Check if any seat is already booked
    const alreadyBooked = seats.some((seat) => bus.bookedSeats.includes(seat))
    if (alreadyBooked) {
      console.log("Booking failed: Some seats are already booked")
      return res.status(400).json({ success: false, message: "Some seats are already booked" })
    }

    // Validate payment method
    const validPaymentMethods = ["Credit Card", "Debit Card", "UPI", "Net Banking"]
    if (!validPaymentMethods.includes(paymentMethod)) {
      console.log("Booking failed: Invalid payment method")
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Valid options are: ${validPaymentMethods.join(", ")}`,
      })
    }

    // Validate payment status
    const validPaymentStatuses = ["Pending", "Completed", "Failed"]
    if (!validPaymentStatuses.includes(paymentStatus)) {
      console.log("Booking failed: Invalid payment status")
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Valid options are: ${validPaymentStatuses.join(", ")}`,
      })
    }

    // Create booking document with payment status and bus details
    const bookingData = {
      user: req.user._id,
      bus: busId,
      busName: bus.name,
      busNumber: bus.number,
      busType: bus.type,
      busFrom: bus.from,
      busTo: bus.to,
      seatsBooked: seats,
      totalAmount: seats.length * bus.fare,
      travelDate: bus.date,
      paymentStatus,
      paymentMethod,
      status: paymentStatus === "Completed" ? "Confirmed" : "Pending", // Set booking status based on payment
    }

    console.log("Creating booking with data:", bookingData)

    // Create the booking first to ensure it's saved
    const booking = await Booking.create(bookingData)

    if (!booking) {
      console.log("Booking failed: Could not create booking record")
      return res.status(500).json({ success: false, message: "Failed to create booking record" })
    }

    console.log("Booking created successfully:", booking)

    // Now update the bus with booked seats
    bus.bookedSeats.push(...seats)
    await bus.save()

    console.log("Bus updated with booked seats:", bus.bookedSeats)

    res.status(201).json({
      success: true,
      message: "Booking successful",
      booking,
    })
  } catch (err) {
    console.error("Booking error:", err)
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ success: false, message: "Validation error", errors: Object.values(err.errors).map((e) => e.message) })
    } else if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid ID format" })
    }
    next(err)
  }
}

// GET: Logged-in user's bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    console.log("Getting bookings for user:", req.user._id)
    const bookings = await Booking.find({ user: req.user._id }).populate("bus").populate("user").sort({ createdAt: -1 })
    console.log(`Found ${bookings.length} bookings for user`)

    if (bookings.length === 0) {
      return res.json({ success: true, message: "No bookings found", bookings: [] })
    }

    res.json({ success: true, message: "Bookings fetched successfully", bookings })
  } catch (err) {
    console.error("Get my bookings error:", err)
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid user ID format" })
    }
    next(err)
  }
}

// GET: Admin - All bookings
exports.getAllBookings = async (req, res, next) => {
  try {
    console.log("Admin getting all bookings")
    const bookings = await Booking.find().populate("bus").populate({ path: "user", model: "UserAlternative" }).sort({ createdAt: -1 })
    console.log(`Found ${bookings.length} total bookings`)

    res.json({ success: true, bookings })
  } catch (err) {
    console.error("Get all bookings error:", err)
    next(err)
  }
}

// DELETE: Cancel a booking
exports.cancelBooking = async (req, res, next) => {
  try {
    console.log("Cancelling booking:", req.params.bookingId)
    const booking = await Booking.findById(req.params.bookingId)
    if (!booking) {
      console.log("Booking not found")
      return res.status(404).json({ success: false, message: "Booking not found" })
    }

    const bus = await Bus.findById(booking.bus)
    if (!bus) {
      console.log("Bus not found")
      return res.status(404).json({ success: false, message: "Bus not found" })
    }

    // Remove booked seats from the bus
    bus.bookedSeats = bus.bookedSeats.filter((seat) => !booking.seatsBooked.includes(seat))
    await bus.save()
    console.log("Updated bus seats after cancellation")

    // Update booking status to cancelled instead of deleting
    booking.status = "Cancelled"
    await booking.save()
    console.log("Booking marked as cancelled successfully")

    res.json({ success: true, message: "Booking cancelled successfully" })
  } catch (err) {
    console.error("Booking cancellation error:", err)
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid booking ID format" })
    }
    next(err)
  }
}

// DELETE: Clear all bookings (Admin only)
exports.clearAllBookings = async (req, res, next) => {
  try {
    console.log("Admin clearing all bookings")
    // First, get all buses and clear their booked seats
    const buses = await Bus.find()
    for (const bus of buses) {
      bus.bookedSeats = []
      await bus.save()
    }
    console.log(`Reset booked seats for ${buses.length} buses`)

    // Then delete all bookings
    const result = await Booking.deleteMany({})
    console.log(`Deleted ${result.deletedCount} bookings`)

    res.json({
      success: true,
      message: "All bookings have been cleared and bus seats have been reset",
    })
  } catch (err) {
    console.error("Clear all bookings error:", err)
    next(err)
  }
}
