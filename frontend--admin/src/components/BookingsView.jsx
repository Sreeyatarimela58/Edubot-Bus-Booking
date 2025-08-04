"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  User,
  Bus,
  MapPin,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  CreditCard,
} from "lucide-react"

const BookingsView = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [cancellingBooking, setCancellingBooking] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [startDate, endDate])

  const cancelBooking = async (bookingId) => {
    if (!bookingId) return

    try {
      setCancellingBooking(true)
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`https://edubot-bus-booking.onrender.com/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update the booking status in the local state
        setBookings((prevBookings) =>
          prevBookings.map((booking) => (booking._id === bookingId ? { ...booking, status: "Cancelled" } : booking)),
        )

        // Also update the selected booking if it's the one being cancelled
        if (selectedBooking && selectedBooking._id === bookingId) {
          setSelectedBooking((prev) => ({ ...prev, status: "Cancelled" }))
        }

        alert("Booking has been cancelled successfully.")
      } else {
        throw new Error(data.message || "Failed to cancel booking")
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      alert(error.message || "An error occurred while cancelling the booking")
    } finally {
      setCancellingBooking(false)
      // Don't close the modal immediately, let user see the updated status
    }
  }

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      let url = "https://edubot-bus-booking.onrender.com/api/admin/bookings"

      // Add query parameters for date range if provided
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`
      } else if (startDate) {
        url += `?startDate=${startDate}`
      } else if (endDate) {
        url += `?endDate=${endDate}`
      }

      // Add search term if provided
      if (searchTerm) {
        url += `${url.includes("?") ? "&" : "?"}searchTerm=${searchTerm}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "text-emerald-600 bg-emerald-100"
      case "cancelled":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bus?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bus?.number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || booking.status?.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesFilter
  })

  // Calculate stats
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status?.toLowerCase() === "confirmed").length,
    cancelled: bookings.filter((b) => b.status?.toLowerCase() === "cancelled").length,
    revenue: bookings
      .filter((b) => b.status?.toLowerCase() === "confirmed")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">Track and manage all passenger reservations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-emerald-600 text-sm font-medium">Total Bookings</p>
          <p className="text-2xl font-bold text-emerald-900">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-blue-600 text-sm font-medium">Confirmed</p>
          <p className="text-2xl font-bold text-blue-900">{stats.confirmed}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-red-600 text-sm font-medium">Cancelled</p>
          <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-2xl border border-teal-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-teal-600 text-sm font-medium">Revenue</p>
          <p className="text-2xl font-bold text-teal-900">₹{stats.revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by passenger name or bus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
          />
        </div>
        <div className="flex space-x-2">
          <div className="relative flex">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
            />
            {startDate && (
              <button
                onClick={() => setStartDate("")}
                className="bg-gray-100 hover:bg-gray-200 px-3 border border-gray-200 transition-colors duration-300"
              >
                ✕
              </button>
            )}
          </div>
          <div className="relative flex">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
            />
            {endDate && (
              <button
                onClick={() => setEndDate("")}
                className="bg-gray-100 hover:bg-gray-200 px-3 border border-gray-200 rounded-r-xl transition-colors duration-300"
              >
                ✕
              </button>
            )}
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("")
                setEndDate("")
                fetchBookings()
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl transition-colors duration-300"
            >
              Reset
            </button>
          )}
          {(startDate || endDate) && (
            <button
              onClick={fetchBookings}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl transition-colors duration-300"
            >
              Apply
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 appearance-none"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Passenger</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Bus Details</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Journey</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Booking Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Travel Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{booking.user?.name || "N/A"}</p>
                        <p className="text-sm text-gray-600">{booking.user?.email || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{booking.busName || booking.bus?.name || "N/A"}</p>
                        <p className="text-sm text-gray-600">{booking.busNumber || booking.bus?.number || "N/A"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {booking.busFrom || booking.bus?.from || "N/A"} → {booking.busTo || booking.bus?.to || "N/A"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-gray-900">
                        {booking.createdAt
                          ? typeof booking.createdAt === "string" && booking.createdAt.includes("/")
                            ? booking.createdAt.split(",")[0]
                            : new Date(booking.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-900">
                        {booking.travelDate ? booking.travelDate.split(",")[0] : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900">₹{booking.totalAmount || 0}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                    >
                      {getStatusIcon(booking.status)}
                      {booking.status || "Unknown"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No bookings found for "{searchTerm}"</p>
                <p className="text-gray-400">Try a different search term or clear the filter</p>
              </>
            ) : (
              <>
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No bookings found</p>
                <p className="text-gray-400">Try adjusting your filter criteria</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
              <h3 className="text-2xl font-bold">Booking Details</h3>
              <p className="text-emerald-100 mt-1">Complete booking information</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Passenger Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  Passenger Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.user?.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Booking ID</p>
                    <p className="font-semibold text-gray-900">{selectedBooking._id}</p>
                  </div>
                </div>
              </div>

              {/* Bus Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Bus className="w-5 h-5 text-emerald-600" />
                  Bus Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Bus Name</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.busName || selectedBooking.bus?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bus Number</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.busNumber || selectedBooking.bus?.number || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Route</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.busFrom || selectedBooking.bus?.from || "N/A"} →{" "}
                      {selectedBooking.busTo || selectedBooking.bus?.to || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Booking Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Seats Booked</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.seatsBooked?.join(", ") || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold text-gray-900">₹{selectedBooking.totalAmount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Booking Date</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.createdAt
                        ? typeof selectedBooking.createdAt === "string" && selectedBooking.createdAt.includes("/")
                          ? selectedBooking.createdAt
                          : new Date(selectedBooking.createdAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Travel Date</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.travelDate ? selectedBooking.travelDate.split(",")[0] : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}
                    >
                      {getStatusIcon(selectedBooking.status)}
                      {selectedBooking.status || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                {selectedBooking.status?.toLowerCase() !== "cancelled" && (
                  <button
                    onClick={() => cancelBooking(selectedBooking._id)}
                    disabled={cancellingBooking}
                    className="w-1/2 bg-red-100 text-red-700 py-3 px-6 rounded-xl font-semibold hover:bg-red-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancellingBooking ? "Cancelling..." : "Cancel Booking"}
                  </button>
                )}
                {selectedBooking.status?.toLowerCase() === "cancelled" && (
                  <div className="w-1/2 bg-red-50 text-red-600 py-3 px-6 rounded-xl font-semibold text-center border border-red-200">
                    Booking Cancelled
                  </div>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className={`${selectedBooking.status?.toLowerCase() !== "cancelled" ? "w-1/2" : "w-1/2"} bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingsView
