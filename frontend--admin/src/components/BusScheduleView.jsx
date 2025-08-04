"use client"

// src/components/BusScheduleView.jsx
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Bus, AlertCircle } from "lucide-react"
import { adminService } from "../services/api"
import LoadingSpinner from "./LoadingSpinner"

const BusScheduleView = () => {
  const [buses, setBuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Format date to YYYY-MM-DD
  const formatDateForAPI = (date) => {
    return date.toISOString().split("T")[0]
  }

  // Format date for display
  const formatDateForDisplay = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Get dates for the current week
  const getWeekDates = (startDate) => {
    const dates = []
    const currentDate = new Date(startDate)

    // Start from current date
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Navigate to previous week
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  // Navigate to next week
  const goToNext = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Fetch buses for a date range
  const fetchBusesForDateRange = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get start and end of week
      const dates = getWeekDates(currentDate)
      const startDate = formatDateForAPI(dates[0])
      const endDate = formatDateForAPI(dates[dates.length - 1])

      const data = await adminService.getBusesForDateRange(startDate, endDate)
      setBuses(data || [])
    } catch (err) {
      console.error("Error fetching buses:", err)
      setError(err.response?.data?.message || "Failed to fetch buses")
    } finally {
      setLoading(false)
    }
  }

  // Handle date click
  const handleDateClick = (date) => {
    setCurrentDate(date)
  }

  // Fetch data when date changes
  useEffect(() => {
    fetchBusesForDateRange()
  }, [currentDate])

  // Get dates for the week
  const dates = getWeekDates(currentDate)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bus Schedule</h1>
      </div>

      {/* Date Navigation */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <button onClick={goToPrevious} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-gray-900">
              {`Week of ${formatDateForDisplay(dates[0])} - ${formatDateForDisplay(dates[6])}`}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Today
            </button>
          </div>
          <button onClick={goToNext} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Date Selector */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dates.map((date, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={`p-2 rounded-lg text-center ${
                formatDateForAPI(date) === formatDateForAPI(currentDate)
                  ? "bg-red-600 text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="text-xs font-medium">{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
              <div className="text-lg font-bold">{date.getDate()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Buses Schedule */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          <Bus className="inline mr-2" size={20} />
          Upcoming Bus Schedule
        </h2>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Buses</h3>
            <p className="text-gray-600 mb-4">{error}</p>
          </div>
        ) : buses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No buses scheduled for this period</div>
        ) : (
          <div className="space-y-6">
            {buses.map((daySchedule, index) => {
              const scheduleDate = new Date(daySchedule.date)
              const isToday = formatDateForAPI(scheduleDate) === formatDateForAPI(new Date())

              return (
                <div
                  key={index}
                  className={`border rounded-lg ${isToday ? "border-red-200 bg-red-50" : "border-gray-200"}`}
                >
                  <div
                    className={`p-3 border-b ${isToday ? "bg-red-100 text-red-800" : "bg-gray-50 text-gray-700"} font-medium rounded-t-lg`}
                  >
                    {formatDateForDisplay(scheduleDate)} {isToday && "(Today)"}
                  </div>

                  {daySchedule.buses.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No buses scheduled for this day</div>
                  ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {daySchedule.buses.map((bus) => (
                        <div
                          key={bus._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 text-lg font-semibold text-red-600 mb-2">
                            <Bus className="text-red-500" size={20} />
                            {bus.name}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {bus.from} <span className="text-gray-400">→</span> {bus.to}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            Departure: <span className="font-medium">{bus.departureTime}</span>
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            Arrival: <span className="font-medium">{bus.arrivalTime}</span>
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            Type: <span className="font-medium">{bus.type}</span>
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            Fare: <span className="font-medium text-red-600">₹{bus.fare}</span>
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            Available Seats:{" "}
                            <span className="font-medium">
                              {bus.availableSeatsCount}/{bus.totalSeats}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mb-1">
                            Bookings: <span className="font-medium">{bus.bookingsCount}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              {bus.runsOnAllDays
                                ? "Runs every day"
                                : bus.runningDays?.length > 0
                                  ? `Runs on: ${bus.runningDays.join(", ")}`
                                  : "One-time trip"}
                            </div>
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
  )
}

export default BusScheduleView
