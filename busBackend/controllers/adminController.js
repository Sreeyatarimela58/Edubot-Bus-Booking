// controllers/adminController.js

const Booking = require("../models/bookingModel")
const User = require("../models/userModel")
const Bus = require("../models/busModel")

// Helper function to convert to IST
const toIST = (date = new Date()) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
}

// Format date to IST string
const formatToIST = (date) => {
  return toIST(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// GET /admin/bookings - Enhanced to show complete information
const getAllBookings = async (req, res) => {
  try {
    const { searchTerm, date, startDate, endDate } = req.query
    let query = {}

    if (searchTerm) {
      query = {
        $or: [
          { "user.name": { $regex: searchTerm, $options: "i" } },
          { "user.email": { $regex: searchTerm, $options: "i" } },
          { busName: { $regex: searchTerm, $options: "i" } },
          { busFrom: { $regex: searchTerm, $options: "i" } },
          { busTo: { $regex: searchTerm, $options: "i" } },
          { busNumber: { $regex: searchTerm, $options: "i" } },
        ],
      }
    }

    // Add date filter if provided (using string comparison)
    if (date) {
      query.travelDate = date
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      query.travelDate = {
        $gte: startDate,
        $lte: endDate,
      }
    }

    // Fetch bookings with complete user and bus information
    const bookings = await Booking.find(query)
      .populate({
        path: "user",
        select: "name email phone",
        model: "User",
      })
      .populate({
        path: "bus",
        select: "name from to date number type departureTime arrivalTime",
      })
      .sort({ travelDate: 1 })

    // Enhance bookings with complete information
    const enhancedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const bookingObj = booking.toObject()

        // Ensure user information is complete
        if (booking.user) {
          // If user doesn't have phone in the populated data, fetch it
          if (!booking.user.phone) {
            const fullUser = await User.findById(booking.user._id).select("phone")
            if (fullUser && fullUser.phone) {
              bookingObj.user.phone = fullUser.phone
            } else {
              bookingObj.user.phone = "N/A"
            }
          }
        } else {
          // If user reference is missing, try to find by booking user field
          const user = await User.findById(booking.user).select("name email phone")
          if (user) {
            bookingObj.user = {
              _id: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone || "N/A",
            }
          }
        }

        // Ensure bus information is complete
        if (booking.bus) {
          const bus = booking.bus
          // Fill missing bus information from the bus document
          bookingObj.busName = bookingObj.busName || bus.name || "Unknown Bus"
          bookingObj.busNumber = bookingObj.busNumber || bus.number || "N/A"
          bookingObj.busType = bookingObj.busType || bus.type || "AC"
          bookingObj.busDepartureTime = bookingObj.busDepartureTime || bus.departureTime || "00:00"
          bookingObj.busArrivalTime = bookingObj.busArrivalTime || bus.arrivalTime || "00:00"
          bookingObj.busFrom = bookingObj.busFrom || bus.from || "Unknown"
          bookingObj.busTo = bookingObj.busTo || bus.to || "Unknown"
        } else {
          // If bus reference exists but not populated, fetch it
          if (booking.bus) {
            const bus = await Bus.findById(booking.bus)
            if (bus) {
              bookingObj.busName = bookingObj.busName || bus.name
              bookingObj.busNumber = bookingObj.busNumber || bus.number
              bookingObj.busType = bookingObj.busType || bus.type
              bookingObj.busDepartureTime = bookingObj.busDepartureTime || bus.departureTime
              bookingObj.busArrivalTime = bookingObj.busArrivalTime || bus.arrivalTime
            }
          }
        }

        // Format dates to IST for response
        bookingObj.createdAt = formatToIST(booking.createdAt)
        bookingObj.updatedAt = formatToIST(booking.updatedAt)
        bookingObj.travelDate = formatToIST(booking.travelDate)

        return bookingObj
      }),
    )

    console.log(`Admin fetched ${enhancedBookings.length} bookings with complete information`)
    res.status(200).json({ success: true, bookings: enhancedBookings })
  } catch (error) {
    console.error("Error fetching bookings:", error.message)
    res.status(500).json({ success: false, message: "Server Error" })
  }
}

// GET buses running on a specific date
const getBusesForDate = async (req, res) => {
  try {
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ success: false, message: "Date parameter is required" })
    }

    // Find buses that match the exact date string
    const buses = await Bus.find({ date: date }).sort({ departureTime: 1 })

    // Get booking stats for each bus on this date
    const busesWithStats = await Promise.all(
      buses.map(async (bus) => {
        const bookings = await Booking.find({
          bus: bus._id,
          travelDate: date,
        })

        const bookedSeats = bookings.reduce((seats, booking) => {
          return [...seats, ...booking.seatsBooked]
        }, [])

        return {
          ...bus.toObject(),
          bookedSeatsCount: bookedSeats.length,
          availableSeatsCount: bus.totalSeats - bookedSeats.length,
          bookingsCount: bookings.length,
        }
      }),
    )

    res.status(200).json({ success: true, buses: busesWithStats, date: date })
  } catch (error) {
    console.error("Error fetching buses for date:", error.message)
    res.status(500).json({ success: false, message: "Server Error" })
  }
}

// Get weekly booking stats for a specific bus
const getBusWeeklyStats = async (req, res) => {
  try {
    const { busId } = req.params
    const { startDate } = req.query

    if (!busId) {
      return res.status(400).json({ success: false, message: "Bus ID is required" })
    }

    // Default to current date if no start date provided
    const start = startDate || new Date().toISOString().split("T")[0]

    // Get stats for 7 days starting from the start date
    const weeklyStats = []

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(currentDate.getDate() + i)
      const dateString = currentDate.toISOString().split("T")[0]

      const bookings = await Booking.find({
        bus: busId,
        travelDate: dateString,
      })

      const bookedSeats = bookings.reduce((seats, booking) => {
        return [...seats, ...booking.seatsBooked]
      }, [])

      const bus = await Bus.findById(busId)

      weeklyStats.push({
        date: dateString,
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][currentDate.getDay()],
        totalBookings: bookings.length,
        bookedSeats: bookedSeats,
        bookedSeatsCount: bookedSeats.length,
        availableSeatsCount: bus ? bus.totalSeats - bookedSeats.length : 0,
      })
    }

    res.status(200).json({ success: true, busId, weeklyStats })
  } catch (error) {
    console.error("Error fetching bus weekly stats:", error.message)
    res.status(500).json({ success: false, message: "Server Error" })
  }
}

// GET buses running for a date range (week)
const getBusesForDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Start date and end date parameters are required" })
    }

    // Get all buses that run during this period
    const buses = await Bus.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ departureTime: 1 })

    // For each day in the range, check which buses are running
    const busSchedule = []
    const currentDate = new Date(startDate)
    const endDateObj = new Date(endDate)

    while (currentDate <= endDateObj) {
      const dateString = currentDate.toISOString().split("T")[0]

      // Filter buses running on this day - exact date match
      const runningBuses = buses.filter((bus) => bus.date === dateString)

      // Get booking stats for each bus on this date
      const busesWithStats = await Promise.all(
        runningBuses.map(async (bus) => {
          const bookings = await Booking.find({
            bus: bus._id,
            travelDate: dateString,
          })

          const bookedSeats = bookings.reduce((seats, booking) => {
            return [...seats, ...booking.seatsBooked]
          }, [])

          return {
            ...bus.toObject(),
            bookedSeatsCount: bookedSeats.length,
            availableSeatsCount: bus.totalSeats - bookedSeats.length,
            bookingsCount: bookings.length,
          }
        }),
      )

      busSchedule.push({
        date: dateString,
        buses: busesWithStats,
      })

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    res.status(200).json({ success: true, busSchedule })
  } catch (error) {
    console.error("Error fetching buses for date range:", error.message)
    res.status(500).json({ success: false, message: "Server Error" })
  }
}

// Get monthly bookings summary
const getMonthlyBookings = async (req, res) => {
  try {
    const { year, month } = req.query

    if (!year || !month) {
      return res.status(400).json({ success: false, message: "Year and month parameters are required" })
    }

    // Create date range for the month
    const startDate = `${year}-${month.padStart(2, "0")}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const endDate = `${year}-${month.padStart(2, "0")}-${daysInMonth.toString().padStart(2, "0")}`

    // Get all bookings for the month
    const bookings = await Booking.find({
      travelDate: { $gte: startDate, $lte: endDate },
    })
      .populate({ path: "user", select: "name email phone" })
      .populate("bus", "name from to date")

    // Group bookings by date
    const bookingsByDate = {}

    bookings.forEach((booking) => {
      const dateKey = booking.travelDate

      if (!bookingsByDate[dateKey]) {
        bookingsByDate[dateKey] = []
      }

      bookingsByDate[dateKey].push(booking)
    })

    // Create a summary for each day of the month
    const monthlySummary = []
    const currentDate = new Date(startDate)
    const endDateObj = new Date(endDate)

    while (currentDate <= endDateObj) {
      const dateKey = currentDate.toISOString().split("T")[0]
      const dayBookings = bookingsByDate[dateKey] || []

      monthlySummary.push({
        date: dateKey,
        bookings: dayBookings,
        totalBookings: dayBookings.length,
        totalRevenue: dayBookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    res.status(200).json({
      success: true,
      month: Number.parseInt(month),
      year: Number.parseInt(year),
      monthlySummary,
    })
  } catch (error) {
    console.error("Error fetching monthly bookings:", error.message)
    res.status(500).json({ success: false, message: "Server Error" })
  }
}

module.exports = {
  getAllBookings,
  getBusesForDate,
  getBusesForDateRange,
  getMonthlyBookings,
  getBusWeeklyStats,
}
