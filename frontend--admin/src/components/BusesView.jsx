"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Bus, Clock, MapPin, Users, X } from "lucide-react"
import { adminService } from "../services/api"

const BusesView = () => {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBus, setSelectedBus] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    busNumber: "",
    from: "",
    to: "",
    departureTime: "",
    arrivalTime: "",
    fare: "",
    date: "",
    totalSeats: 40,
    amenities: [],
    busType: "AC Sleeper",
  })

  useEffect(() => {
    fetchBuses()
  }, [])

  const fetchBuses = async () => {
    try {
      setLoading(true)
      const response = await adminService.getBuses()
      setBuses(response.data.buses || [])
    } catch (error) {
      console.error("Error fetching buses:", error)
      setError("Failed to fetch buses")
    } finally {
      setLoading(false)
    }
  }

  const handleAddBus = async (e) => {
    e.preventDefault()
    try {
      // Map frontend field names to backend field names
      const busData = {
        ...formData,
        number: formData.busNumber, // Map busNumber to number
        type: formData.busType, // Map busType to type
      }
      delete busData.busNumber // Remove the frontend field name
      delete busData.busType // Remove the frontend field name
      
      const response = await adminService.addBus(busData)
      if (response.data.success) {
        setBuses([response.data.bus, ...buses])
        setShowAddModal(false)
        resetForm()
        alert("Bus added successfully!")
      }
    } catch (error) {
      console.error("Error adding bus:", error)
      alert(error.response?.data?.message || "Failed to add bus")
    }
  }

  const handleEditBus = async (e) => {
    e.preventDefault()
    try {
      // Map frontend field names to backend field names
      const busData = {
        ...formData,
        number: formData.busNumber, // Map busNumber to number
        type: formData.busType, // Map busType to type
      }
      delete busData.busNumber // Remove the frontend field name
      delete busData.busType // Remove the frontend field name
      
      const response = await adminService.updateBus(selectedBus._id, busData)
      if (response.data.success) {
        setBuses(buses.map((bus) => (bus._id === selectedBus._id ? response.data.bus : bus)))
        setShowEditModal(false)
        setSelectedBus(null)
        resetForm()
        alert("Bus updated successfully!")
      }
    } catch (error) {
      console.error("Error updating bus:", error)
      alert(error.response?.data?.message || "Failed to update bus")
    }
  }

  const handleDeleteBus = async (busId) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      try {
        const response = await adminService.deleteBus(busId)
        if (response.data.success) {
          setBuses(buses.filter((bus) => bus._id !== busId))
          alert("Bus deleted successfully!")
        }
      } catch (error) {
        console.error("Error deleting bus:", error)
        const errorMessage = error.response?.data?.message || "Failed to delete bus"
        alert(errorMessage)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      busNumber: "",
      from: "",
      to: "",
      departureTime: "",
      arrivalTime: "",
      fare: "",
      date: "",
      totalSeats: 40,
      amenities: [],
      busType: "AC Sleeper",
    })
  }

  const openEditModal = (bus) => {
    setSelectedBus(bus)
    setFormData({
      name: bus.name,
      busNumber: bus.number || "", // Map backend number to frontend busNumber
      from: bus.from,
      to: bus.to,
      departureTime: bus.departureTime,
      arrivalTime: bus.arrivalTime,
      fare: bus.fare,
      date: bus.date,
      totalSeats: bus.totalSeats,
      amenities: bus.amenities || [],
      busType: bus.type || "AC", // Map backend type to frontend busType
    })
    setShowEditModal(true)
  }

  const filteredBuses = buses.filter(
    (bus) =>
      bus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bus.number && bus.number.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bus Management</h2>
          <p className="text-gray-600">Manage your bus fleet</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Bus
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search buses by name, route, or bus number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {/* Buses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuses.map((bus) => (
          <div key={bus._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{bus.name}</h3>
                  <p className="text-sm text-gray-500">{bus.number || "No number"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(bus)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBus(bus._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {bus.from} → {bus.to}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {bus.departureTime} - {bus.arrivalTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{bus.totalSeats} seats</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-lg font-semibold text-green-600">₹{bus.fare}</span>
                  <span className="text-sm text-gray-500">{formatDate(bus.date)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBuses.length === 0 && !loading && (
        <div className="text-center py-12">
          <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
          <p className="text-gray-500">
            {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first bus"}
          </p>
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Bus</h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddBus} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bus name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.busNumber}
                    onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., BUS001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From *</label>
                  <input
                    type="text"
                    required
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Departure city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                  <input
                    type="text"
                    required
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Destination city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: Number.parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fare (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.fare}
                    onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter fare amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type</label>
                  <select
                    value={formData.busType}
                    onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="AC Sleeper">AC Sleeper</option>
                    <option value="Non-AC Sleeper">Non-AC Sleeper</option>
                    <option value="AC Seater">AC Seater</option>
                    <option value="Non-AC Seater">Non-AC Seater</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
                >
                  Add Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {showEditModal && selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Bus</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedBus(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditBus} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus Number <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.busNumber}
                    onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., BUS001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From *</label>
                  <input
                    type="text"
                    required
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                  <input
                    type="text"
                    required
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalSeats}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Seats cannot be modified after bus creation</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fare (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.fare}
                    onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter fare amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type</label>
                  <select
                    value={formData.busType}
                    onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="AC Sleeper">AC Sleeper</option>
                    <option value="Non-AC Sleeper">Non-AC Sleeper</option>
                    <option value="AC Seater">AC Seater</option>
                    <option value="Non-AC Seater">Non-AC Seater</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedBus(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
                >
                  Update Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusesView
