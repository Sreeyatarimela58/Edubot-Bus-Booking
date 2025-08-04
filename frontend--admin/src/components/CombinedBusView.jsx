"use client"

import { useEffect, useState } from "react"
import { adminService } from "../services/api"
import LoadingSpinner from "./LoadingSpinner"

const CombinedBusView = () => {
  const [buses, setBuses] = useState([])
  const [allBuses, setAllBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedBus, setSelectedBus] = useState(null)
  const [viewMode, setViewMode] = useState("date") // 'date' or 'list'
  const [formData, setFormData] = useState({
    name: "",
    from: "",
    to: "",
    date: new Date().toISOString().split("T")[0],
    departureTime: "",
    arrivalTime: "",
    fare: 0,
    isActive: true,
    totalSeats: 40,
    type: "AC",
  })

  const [nameError, setNameError] = useState("")

  // Add these helper functions at the top of the component
  const toIST = (date = new Date()) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  }
  
  const formatToIST = (date) => {
  return toIST(date).toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  })
  }
  
  // Update formatDateForAPI to use IST
  const formatDateForAPI = (date) => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("Invalid date provided to formatDateForAPI:", date);
    return "";
  }
  
  // Ensure we're using IST date and format as YYYY-MM-DD
  const istDate = toIST(date);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
  
  // Update formatDateForDisplay to use IST
  const formatDateForDisplay = (date) => {
  try {
  const dateObj = toIST(new Date(date))
  if (isNaN(dateObj.getTime())) {
  console.error("Invalid date provided to formatDateForDisplay:", date)
  return "Invalid Date"
  }
  return dateObj.toLocaleDateString("en-IN", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Kolkata"
  })
  } catch (err) {
  console.error("Error in formatDateForDisplay:", err)
  return "Invalid Date"
  }
  }

  const getWeekDates = () => {
  const dates = [];
  try {
    // Ensure we're using IST for today's date
    const today = toIST(new Date());
    today.setHours(0, 0, 0, 0);

    if (isNaN(today.getTime())) {
      console.error("Invalid today date in getWeekDates");
      return [new Date()];
    }

    const currentDate = new Date(today);

    for (let i = 0; i < 7; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  } catch (err) {
    console.error("Error in getWeekDates:", err);
    return [new Date()];
  }
}

  const goToPrevious = () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (isNaN(today.getTime())) {
        console.error("Invalid today date in goToPrevious")
        return
      }

      setCurrentDate(today)
    } catch (err) {
      console.error("Error in goToPrevious:", err)
    }
  }

  const goToNext = () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (isNaN(today.getTime())) {
        console.error("Invalid today date in goToNext")
        return
      }

      if (formatDateForAPI(currentDate) === formatDateForAPI(today)) {
        return
      }

      setCurrentDate(today)
    } catch (err) {
      console.error("Error in goToNext:", err)
    }
  }

  const goToToday = () => {
    try {
      const today = new Date()

      if (isNaN(today.getTime())) {
        console.error("Invalid today date in goToToday")
        return
      }

      setCurrentDate(today)
    } catch (err) {
      console.error("Error in goToToday:", err)
    }
  }

  const fetchAllBuses = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await adminService.getBuses()
      console.log("Fetched all buses:", data)

      if (data && Array.isArray(data)) {
        setAllBuses(data)
      } else if (data && data.buses && Array.isArray(data.buses)) {
        setAllBuses(data.buses)
      } else {
        setAllBuses([])
        console.error("Unexpected data format for all buses:", data)
      }
    } catch (err) {
      console.error("Error fetching all buses:", err)
      setError(err.response?.data?.message || "Failed to fetch buses")
    } finally {
      setLoading(false)
    }
  }

  const fetchBusesForDateRange = async () => {
  try {
    setLoading(true);
    setError(null);

    const dates = getWeekDates();
    const startDate = formatDateForAPI(dates[0]);
    const endDate = formatDateForAPI(dates[dates.length - 1]);

    console.log("Fetching buses for date range:", startDate, "to", endDate);
    const data = await adminService.getBusesForDateRange(startDate, endDate);
    console.log("Fetched buses for date range:", data);

    if (data && data.success) {
      if (data.busSchedule && Array.isArray(data.busSchedule)) {
        // Add IST formatted display dates to each bus
        const busScheduleWithIST = data.busSchedule.map(daySchedule => ({
          ...daySchedule,
          displayDate: formatToIST(new Date(daySchedule.date)),
          buses: daySchedule.buses.map(bus => ({
            ...bus,
            departureTimeIST: `${bus.departureTime} IST`,
            arrivalTimeIST: `${bus.arrivalTime} IST`,
          }))
        }));
        
        setBuses(busScheduleWithIST);
        console.log("Setting buses from busSchedule with IST:", busScheduleWithIST);
      } else {
        console.warn("Unexpected data format or no data from backend:", data);
        const emptySchedule = dates.map((date) => ({
          date: formatDateForAPI(date),
          displayDate: formatToIST(date),
          buses: [],
        }));
        setBuses(emptySchedule);
        console.log("Created empty schedule:", emptySchedule);
      }
    } else {
      console.error("No data or unsuccessful response:", data);
      const emptySchedule = dates.map((date) => ({
        date: formatDateForAPI(date),
        displayDate: formatToIST(date),
        buses: [],
      }));
      setBuses(emptySchedule);
    }
  } catch (err) {
    console.error("Error fetching buses:", err);
    setError(err.response?.data?.message || "Failed to fetch buses");
  } finally {
    setLoading(false);
  }
}

  const handleDateClick = (date) => {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error("Invalid date provided to handleDateClick:", date)
        return
      }

      setCurrentDate(date)
    } catch (err) {
      console.error("Error in handleDateClick:", err)
    }
  }

  const handleAddBus = async () => {
    try {
      // Prepare bus data
      const busData = {
        name: formData.name,
        number: formData.number,
        from: formData.from,
        to: formData.to,
        date: formData.date, // Keep as string in YYYY-MM-DD format
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        fare: formData.fare,
        isActive: formData.isActive,
        totalSeats: formData.totalSeats,
        type: formData.type,
        amenities: [],
      }

      console.log("Sending bus data:", busData)

      setLoading(true)
      const response = await adminService.addBus(busData)
      console.log("Add bus response:", response)

      setShowAddModal(false)
      resetForm()
      await Promise.all([fetchBusesForDateRange(), fetchAllBuses()])

      alert("Bus added successfully!")
    } catch (err) {
      console.error("Error adding bus:", err)
      const errorMessage = err.response?.data?.message || err.message || "Failed to add bus"
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEditBus = async () => {
    try {
      // Preserve existing values for removed fields
      const busData = {
        ...formData,
        totalSeats: selectedBus.totalSeats || 40,
        type: selectedBus.type || "AC",
        amenities: selectedBus.amenities || [],
        runsOnAllDays: selectedBus.runsOnAllDays || false,
        runningDays: selectedBus.runningDays || [],
      }

      setLoading(true)
      await adminService.updateBus(selectedBus._id, busData)
      setShowEditModal(false)
      resetForm()
      await Promise.all([fetchBusesForDateRange(), fetchAllBuses()])
    } catch (err) {
      console.error("Error updating bus:", err)
      alert(err.response?.data?.message || "Failed to update bus")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBus = async (busId) => {
    if (!window.confirm("Are you sure you want to delete this bus?")) return

    try {
      setLoading(true)
      await adminService.deleteBus(busId)
      await Promise.all([fetchBusesForDateRange(), fetchAllBuses()])
    } catch (err) {
      console.error("Error deleting bus:", err)
      const errorMessage = err.response?.data?.message || "Failed to delete bus"
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (bus) => {
    try {
      // Handle date properly - if it's already a string in YYYY-MM-DD format, use it directly
      let formattedDate = new Date().toISOString().split("T")[0]
  
      if (bus.date) {
        // If bus.date is already in YYYY-MM-DD format, use it directly
        if (typeof bus.date === "string" && bus.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDate = bus.date
        } else {
          // Otherwise, try to parse it as a date
          const busDate = new Date(bus.date)
          if (!isNaN(busDate.getTime())) {
            formattedDate = busDate.toISOString().split("T")[0]
          } else {
            console.error("Invalid date in bus object:", bus.date)
          }
        }
      } else {
        console.error("Missing date in bus object")
      }
  
      setFormData({
        name: bus.name,
        number: bus.number || "",
        from: bus.from,
        to: bus.to,
        date: formattedDate,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        fare: bus.fare,
        isActive: bus.isActive,
        totalSeats: bus.totalSeats || 40,
        type: bus.type || "AC"
      })
      setNameError("")
      setSelectedBus(bus)
      setShowEditModal(true)
    } catch (err) {
      console.error("Error in openEditModal:", err)
      alert("There was an error opening the edit form. Please try again.")
    }
  }

  const resetForm = () => {
    try {
      let todayFormatted = ""
      try {
        const today = new Date()
        if (!isNaN(today.getTime())) {
          todayFormatted = today.toISOString().split("T")[0]
        } else {
          console.error("Invalid date when resetting form")
        }
      } catch (dateErr) {
        console.error("Error formatting date when resetting form:", dateErr)
      }

      setFormData({
        name: "",
        number: "",
        from: "",
        to: "",
        date: todayFormatted,
        departureTime: "",
        arrivalTime: "",
        fare: 0,
        isActive: true,
        totalSeats: 40,
        type: "AC"
      })
      setNameError("")
      setSelectedBus(null)
    } catch (err) {
      console.error("Error in resetForm:", err)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === "name") {
      setNameError("")
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  useEffect(() => {
    try {
      const today = new Date()

      if (isNaN(today.getTime())) {
        console.error("Invalid today date in initial useEffect")
      } else {
        today.setHours(0, 0, 0, 0)
        setCurrentDate(today)
      }

      const fetchData = async () => {
        setLoading(true)
        try {
          await Promise.all([fetchBusesForDateRange(), fetchAllBuses()])
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("Failed to fetch data. Please try again later.")
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    } catch (err) {
      console.error("Error in initial useEffect:", err)
      setError("An unexpected error occurred. Please refresh the page.")
    }
  }, [])

  useEffect(() => {
    fetchBusesForDateRange()
  }, [currentDate])

  const dates = getWeekDates()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Bus Schedule</h1>
        <div className="flex space-x-4">
          <div className="flex border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => setViewMode("date")}
              className={`px-4 py-2 rounded-md ${viewMode === "date" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-md ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              List View
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Add New Bus
          </button>
        </div>
      </div>

      {viewMode === "date" && (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div className="flex justify-center items-center px-4 py-3 bg-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-700">
                  {`Week of ${formatDateForDisplay(dates[0])} - ${formatDateForDisplay(dates[6])}`}
                </h2>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0">
              {dates.map((date, index) => {
                if (!(date instanceof Date) || isNaN(date.getTime())) {
                  console.error("Invalid date in calendar view:", date)
                  return null
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`bg-white hover:bg-gray-100 text-gray-700 py-4 px-2 text-center border-r border-gray-200 last:border-r-0 ${
                      formatDateForAPI(date) === formatDateForAPI(currentDate) ? "bg-blue-100 font-semibold" : ""
                    }`}
                  >
                    {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-100">
              <h2 className="text-xl font-semibold text-gray-700">Buses for {formatDateForDisplay(currentDate)}</h2>
            </div>
            <div className="p-4">
              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <div>
                  {buses.map((daySchedule, index) => {
                    let scheduleDate;
                    try {
                      // Handle date string directly
                      if (typeof daySchedule.date === "string") {
                        scheduleDate = daySchedule.date;
                      } else {
                        scheduleDate = formatDateForAPI(new Date(daySchedule.date));
                      }
                    
                      if (!scheduleDate) {
                        console.error("Invalid date in daySchedule:", daySchedule.date);
                        scheduleDate = formatDateForAPI(new Date());
                      }
                    } catch (err) {
                      console.error("Error parsing date:", err);
                      scheduleDate = formatDateForAPI(new Date());
                    }
                
                    const currentDateFormatted = formatDateForAPI(currentDate);
                    console.log("Comparing dates:", scheduleDate, currentDateFormatted, "equal:", scheduleDate === currentDateFormatted);
                    const isSelectedDate = scheduleDate === currentDateFormatted;
                  
                    if (!isSelectedDate) return null
                  
                    return (
                      <div key={index} className="w-full">
                        {daySchedule.buses.length === 0 ? (
                          <p className="text-gray-500">No buses scheduled for this day</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {daySchedule.buses.map((bus) => (
                              <div
                                key={bus._id}
                                className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                              >
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">{bus.name}</h3>
                                <p className="text-gray-700 text-lg mb-3">
                                  {bus.from} to {bus.to}
                                </p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                                  <p className="text-gray-600">
                                    <span className="font-medium">Departure:</span> {bus.departureTimeIST}
                                  </p>
                                  <p className="text-gray-600">
                                    <span className="font-medium">Arrival:</span> {bus.arrivalTimeIST}
                                  </p>
                                  <p className="text-gray-600">
                                    <span className="font-medium">Type:</span> {bus.type}
                                  </p>
                                  <p className="text-gray-600">
                                    <span className="font-medium">Fare:</span> ₹{bus.fare}
                                  </p>
                                  <p className="text-gray-600">
                                    <span className="font-medium">Available:</span> {bus.availableSeatsCount}/
                                    {bus.totalSeats}
                                  </p>
                                  <p className="text-gray-600">
                                    <span className="font-medium">Bookings:</span> {bus.bookingsCount}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                                  <button
                                    onClick={() => openEditModal(bus)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-5 rounded-md transition-colors duration-200 flex items-center"
                                  >
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBus(bus._id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-5 rounded-md transition-colors duration-200 flex items-center"
                                  >
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {viewMode === "list" && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-100">
            <h2 className="text-xl font-semibold text-gray-700">All Buses</h2>
          </div>
          <div className="p-4">
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Name</th>
                      <th className="py-3 px-6 text-left">Route</th>
                      <th className="py-3 px-6 text-left">Date</th>
                      <th className="py-3 px-6 text-left">Schedule</th>
                      <th className="py-3 px-6 text-left">Type</th>
                      <th className="py-3 px-6 text-left">Fare</th>
                      <th className="py-3 px-6 text-left">Seats</th>
                      <th className="py-3 px-6 text-left">Status</th>
                      <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {allBuses.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-4 px-6 text-center">
                          No buses found
                        </td>
                      </tr>
                    ) : (
                      allBuses.map((bus) => (
                        <tr key={bus._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-6">
                            <div className="font-medium">{bus.name}</div>
                            <div className="text-xs text-gray-500">{bus.number}</div>
                          </td>
                          <td className="py-3 px-6">
                            <div>
                              {bus.from} to {bus.to}
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <div>{bus.date}</div>
                          </td>
                          <td className="py-3 px-6">
                            <div className="text-xs">
                              {bus.departureTime} - {bus.arrivalTime}
                            </div>
                          </td>
                          <td className="py-3 px-6">{bus.type}</td>
                          <td className="py-3 px-6">₹{bus.fare}</td>
                          <td className="py-3 px-6">
                            {bus.availableSeatsCount !== undefined
                              ? `${bus.availableSeatsCount}/${bus.totalSeats}`
                              : bus.totalSeats}
                          </td>
                          <td className="py-3 px-6">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${bus.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                            >
                              {bus.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex item-center justify-center space-x-2">
                              <button
                                onClick={() => openEditModal(bus)}
                                className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteBus(bus._id)}
                                className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 text-center mb-4">Add New Bus</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Name</label>
                  <input
                    type="text"
                    placeholder="Bus Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                  {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., BUS001"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="text"
                    placeholder="Departure City"
                    name="from"
                    value={formData.from}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="text"
                    placeholder="Arrival City"
                    name="to"
                    value={formData.to}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                  <input
                    type="time"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                  <input
                    type="time"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fare (₹)</label>
                  <input
                    type="number"
                    name="fare"
                    value={formData.fare}
                    onChange={handleChange}
                    min="100"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                  <input
                    type="number"
                    name="totalSeats"
                    value={formData.totalSeats}
                    onChange={handleChange}
                    min="10"
                    max="60"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                    <option value="Sleeper">Sleeper</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                  onClick={handleAddBus}
                >
                  Add Bus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 text-center mb-4">Edit Bus</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Name</label>
                  <input
                    type="text"
                    placeholder="Bus Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                  {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., BUS001"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="text"
                    placeholder="Departure City"
                    name="from"
                    value={formData.from}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="text"
                    placeholder="Arrival City"
                    name="to"
                    value={formData.to}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                  <input
                    type="time"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                  <input
                    type="time"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fare (₹)</label>
                  <input
                    type="number"
                    name="fare"
                    value={formData.fare}
                    onChange={handleChange}
                    min="100"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                  <input
                    type="number"
                    name="totalSeats"
                    value={formData.totalSeats || (selectedBus && selectedBus.totalSeats) || 40}
                    readOnly
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Seats cannot be modified after bus creation</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type</label>
                  <select
                    name="type"
                    value={formData.type || (selectedBus && selectedBus.type) || "AC"}
                    disabled
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 cursor-not-allowed"
                  >
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                    <option value="Sleeper">Sleeper</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Bus type cannot be modified after bus creation</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  onClick={handleEditBus}
                >
                  Update Bus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CombinedBusView
