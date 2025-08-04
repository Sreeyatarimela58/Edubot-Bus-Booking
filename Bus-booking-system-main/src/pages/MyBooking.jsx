"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Users, CreditCard, Phone, Mail, User, X } from "lucide-react"
import { getMyBookings, cancelBooking } from "../api/userApi"

const MyBooking = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancellingBookingId, setCancellingBookingId] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      const user = JSON.parse(localStorage.getItem("user"))

      if (!user || !user.token) {
        setError("Please login to view your bookings")
        setLoading(false)
        return
      }

      // Use the imported getMyBookings function from userApi.js
      const bookingsData = await getMyBookings()
      console.log("Bookings data:", bookingsData);

      // Handle the case where bookingsData might be undefined, null, or empty array
      if (bookingsData === undefined || bookingsData === null) {
        setBookings([])
      } else {
        setBookings(bookingsData)
      }

      // Clear error state when successful, even if no bookings
      setError(null)
    } catch (err) {
      console.error("Error fetching bookings:", err)
      // Only set error for actual API errors, not for empty results
      if (err.message === "Authentication required. Please login.") {
        setError("Please login to view your bookings")
      } else {
        setError(err.response?.data?.message || "Failed to fetch bookings")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return
    }

    try {
      setCancellingBookingId(bookingId)
      const user = JSON.parse(localStorage.getItem("user"))

      if (!user || !user.token) {
        alert("Please login to cancel booking")
        return
      }

      // Use the imported cancelBooking function from userApi.js
      const response = await cancelBooking(bookingId)

      if (response.success) {
        // Update the booking status in the local state
        setBookings((prevBookings) =>
          prevBookings.map((booking) => (booking._id === bookingId ? { ...booking, status: "cancelled" } : booking)),
        )
        alert("Booking cancelled successfully")
      } else {
        alert("Failed to cancel booking")
      }
    } catch (err) {
      console.error("Error cancelling booking:", err)
      alert(err.response?.data?.message || "Failed to cancel booking")
    } finally {
      setCancellingBookingId(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return "N/A"
    return timeString
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "✅ Confirmed"
      case "cancelled":
        return "❌ Booking Cancelled"
      case "pending":
        return "⏳ Pending"
      default:
        return status || "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your bus ticket bookings</p>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Bookings Found</h2>
            <p className="text-gray-600 mb-6">You haven't made any bus bookings yet.</p>
            <a
              href="/"
              className="bg-[rgb(218,121,118)] text-white px-6 py-3 rounded-lg hover:bg-[rgb(198,101,98)] transition-colors inline-flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book Your First Trip
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                {/* Header with main color */}
                <div className="bg-[rgb(218,121,118)] text-white p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{booking.busName || "Bus Service"}</h3>
                      <p className="text-white/80 text-sm">
                        Booking ID: <span className="font-mono bg-white/20 px-2 py-1 rounded">{booking._id}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${booking.status?.toLowerCase() === "confirmed"
                        ? "bg-green-500 text-white"
                        : booking.status?.toLowerCase() === "cancelled"
                          ? "bg-red-500 text-white"
                          : "bg-yellow-500 text-white"
                        }`}>
                        {getStatusText(booking.status)}
                      </div>
                      <p className="text-white/80 text-sm mt-2">Booked on {formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Route and Date Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="bg-[rgb(218,121,118)]/10 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-[rgb(218,121,118)]" />
                      </div>
                      <p className="text-sm text-gray-500 mb-1">From</p>
                      <p className="font-bold text-gray-800 text-lg">{booking.busFrom || "N/A"}</p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="bg-[rgb(218,121,118)]/10 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-[rgb(218,121,118)]" />
                      </div>
                      <p className="text-sm text-gray-500 mb-1">To</p>
                      <p className="font-bold text-gray-800 text-lg">{booking.busTo || "N/A"}</p>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="bg-[rgb(218,121,118)]/10 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-[rgb(218,121,118)]" />
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Travel Date</p>
                      <p className="font-bold text-gray-800 text-lg">{formatDate(booking.travelDate)}</p>
                    </div>
                  </div>

                  {/* Timing Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-[rgb(218,121,118)]/5 to-[rgb(218,121,118)]/10 p-6 rounded-xl border border-[rgb(218,121,118)]/20">
                      <div className="flex items-center gap-4">
                        <div className="bg-[rgb(218,121,118)] p-3 rounded-full">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Departure Time</p>
                          <p className="font-bold text-gray-800 text-xl">{formatTime(booking.bus?.departureTime)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-[rgb(218,121,118)]/5 to-[rgb(218,121,118)]/10 p-6 rounded-xl border border-[rgb(218,121,118)]/20">
                      <div className="flex items-center gap-4">
                        <div className="bg-[rgb(218,121,118)] p-3 rounded-full">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Arrival Time</p>
                          <p className="font-bold text-gray-800 text-xl">{formatTime(booking.bus?.arrivalTime)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Passenger and Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                        <div className="bg-[rgb(218,121,118)] p-2 rounded-full">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        Passenger Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Name:</span>
                          <span className="font-medium text-gray-800">
                            {booking.passengerName || booking.user?.name || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Email:</span>
                          <span className="font-medium text-gray-800">
                            {booking.passengerEmail || booking.user?.email || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-500">Phone:</span>
                          <span className="font-medium text-gray-800">
                            {booking.passengerPhone || booking.user?.phone || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                        <div className="bg-[rgb(218,121,118)] p-2 rounded-full">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        Booking Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Seats:</span>
                          <span className="font-medium text-gray-800">{booking.seatsBooked?.join(", ") || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Bus Type:</span>
                          <span className="font-medium text-gray-800">{booking.busType || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-500">Bus Number:</span>
                          <span className="font-medium text-gray-800">{booking.busNumber || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-gradient-to-r from-[rgb(218,121,118)]/10 to-[rgb(218,121,118)]/5 p-6 rounded-xl border border-[rgb(218,121,118)]/20">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="bg-[rgb(218,121,118)] p-2 rounded-full">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-800 text-lg">Total Amount</span>
                      </div>
                      <span className="text-3xl font-bold text-[rgb(218,121,118)]">₹{booking.totalAmount || 0}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                    {booking.status?.toLowerCase() === "confirmed" && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingBookingId === booking._id}
                        className="bg-red-500 text-white px-8 py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                      >
                        {cancellingBookingId === booking._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Cancel Booking
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBooking
