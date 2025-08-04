"use client"

import { useState, useEffect } from "react"
import {
  Bus,
  Users,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  MapPin,
  Clock,
  Wifi,
  Zap,
  Shield,
  AlertCircle,
} from "lucide-react"
import axios from "axios"
import LoadingSpinner from "./LoadingSpinner"

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [buses, setBuses] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBus, setSelectedBus] = useState(null)
  const [showBusModal, setShowBusModal] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBuses: 0,
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    recentBookings: [],
  })

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("adminToken")
        const response = await axios.get("http://localhost:2000/api/admin/dashboard-stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setStats(response.data.stats)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  const getAmenityIcon = (amenity) => {
    switch (amenity?.toLowerCase()) {
      case "wifi":
        return <Wifi className="w-4 h-4" />
      case "charging point":
        return <Zap className="w-4 h-4" />
      case "ac":
        return <Shield className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  const getBusTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "ac":
        return "bg-blue-100 text-blue-800"
      case "sleeper":
        return "bg-purple-100 text-purple-800"
      case "non-ac":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const DashboardView = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Buses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBuses}</p>
            </div>
            <Bus className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue?.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {loading ? (
              <LoadingSpinner size="medium" />
            ) : (
              stats.recentBookings.map((booking) => (
                <div key={booking._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{booking.user?.name}</p>
                    <p className="text-sm text-gray-600">
                      {booking.bus?.name} ({booking.bus?.number}) - Seats: {booking.seatNumbers?.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{booking.totalAmount}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const BusesView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Bus Management</h2>
        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          <Plus className="w-4 h-4" />
          Add New Bus
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search buses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Bus List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          {buses.length > 0 &&
          searchTerm &&
          buses.filter(
            (bus) =>
              bus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              bus.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
              bus.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
              bus.to.toLowerCase().includes(searchTerm.toLowerCase()),
          ).length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No buses found for "{searchTerm}"</p>
              <p className="text-gray-400">Try a different search term</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Occupancy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {buses
                  .filter(
                    (bus) =>
                      !searchTerm ||
                      bus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      bus.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      bus.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      bus.to.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                  .map((bus) => (
                    <tr key={bus._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{bus.name}</span>
                            <span className="text-xs text-gray-500">({bus.number})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBusTypeColor(bus.type)}`}>
                              {bus.type}
                            </span>
                            {bus.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-gray-600">{bus.rating}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {bus.amenities?.slice(0, 3).map((amenity, index) => (
                              <div key={index} className="flex items-center gap-1 text-gray-500">
                                {getAmenityIcon(amenity)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{bus.from}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm text-gray-900">{bus.to}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div className="text-sm text-gray-900">
                            {bus.departureTime} - {bus.arrivalTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bus.bookedSeats.length}/{bus.totalSeats}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(bus.bookedSeats.length / bus.totalSeats) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">₹{bus.fare}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedBus(bus)
                              setShowBusModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )

  const BookingsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Passenger
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{booking._id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.passengerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.busName}</div>
                    <div className="text-sm text-gray-500">{booking.busNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.seatNumbers.join(", ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{booking.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // Bus Details Modal
  const BusModal = () => {
    if (!showBusModal || !selectedBus) return null

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={() => setShowBusModal(false)}
      >
        <div
          className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bus Details</h3>
              <button onClick={() => setShowBusModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Bus Name</label>
                <p className="text-gray-900">{selectedBus.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Bus Number</label>
                <p className="text-gray-900">{selectedBus.number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Route</label>
                <p className="text-gray-900">
                  {selectedBus.from} → {selectedBus.to}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBusTypeColor(selectedBus.type)}`}>
                  {selectedBus.type}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Departure</label>
                <p className="text-gray-900">{selectedBus.departureTime}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Arrival</label>
                <p className="text-gray-900">{selectedBus.arrivalTime}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fare</label>
                <p className="text-gray-900">₹{selectedBus.fare}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Rating</label>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-gray-900">{selectedBus.rating}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Amenities</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedBus.amenities &&
                  selectedBus.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                      {getAmenityIcon(amenity)}
                      <span className="text-xs text-gray-700">{amenity}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Seat Occupancy</label>
              <div className="mt-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Booked: {(selectedBus.bookedSeats && selectedBus.bookedSeats.length) || 0}</span>
                  <span>
                    Available:{" "}
                    {selectedBus.totalSeats - ((selectedBus.bookedSeats && selectedBus.bookedSeats.length) || 0)}
                  </span>
                  <span>Total: {selectedBus.totalSeats || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(((selectedBus.bookedSeats && selectedBus.bookedSeats.length) || 0) / (selectedBus.totalSeats || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Bus Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === "dashboard" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("buses")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === "buses" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Buses
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === "bookings" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Bookings
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <LoadingSpinner size="large" />
          ) : (
            <>
              {activeTab === "dashboard" && <DashboardView />}
              {activeTab === "buses" && <BusesView />}
              {activeTab === "bookings" && <BookingsView />}
            </>
          )}
        </div>
      </main>

      {/* Bus Modal */}
      <BusModal />
    </div>
  )
}

export default AdminDashboard
