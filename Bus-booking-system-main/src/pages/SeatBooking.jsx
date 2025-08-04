"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const SeatBooking = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const bus = location.state?.bus || {
    _id: "default-bus-id",
    name: "No bus selected",
    departureTime: "Not specified",
    arrivalTime: "Not specified",
    fare: 0,
    price: 0,
    totalSeats: 40,
    from: "Not specified",
    to: "Not specified",
    bookedSeats: [],
  }

  // Ensure fare is available for calculations
  if (!bus.fare && bus.price) {
    bus.fare = bus.price
  } else if (!bus.price && bus.fare) {
    bus.price = bus.fare
  }

  // Get travelDate and searchData from navigation state with validation
  let travelDate = location.state?.travelDate || location.state?.searchData?.date || null;
  
  // Validate the travel date
  if (!travelDate) {
    console.warn("No travel date found in location state, using today's date");
    travelDate = new Date().toISOString().split('T')[0];
  }
  
  console.log("Travel date in SeatBooking:", travelDate);
  const searchData = location.state?.searchData || {}

  // Get max passengers from navigation state (default 1)
  const maxPassengers = location.state?.passengers || 1
  console.log("Maximum passengers allowed to select:", maxPassengers)

  const [selectedSeats, setSelectedSeats] = useState([])
  const [bookedSeats, setBookedSeats] = useState([])
  const [reservedSeats, setReservedSeats] = useState([])

  // Load booked seats from the bus data
  useEffect(() => {
    if (bus && bus.bookedSeats) {
      setBookedSeats(bus.bookedSeats)
    }
  }, [bus])

  // Generate reserved seats on first load and store in localStorage
  useEffect(() => {
    // Use bus._id as a seed for deterministic randomization per bus
    const reservedData = JSON.parse(localStorage.getItem("reservedSeats")) || {}
    if (!reservedData[bus._id]) {
      const totalSeats = bus.totalSeats || 40
      const reservedCount = Math.floor(Math.random() * 4) + 3 // 3-6 seats
      const allSeats = Array.from({ length: totalSeats }, (_, i) => i + 1)
      // Shuffle and pick reservedCount seats
      for (let i = allSeats.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[allSeats[i], allSeats[j]] = [allSeats[j], allSeats[i]]
      }
      reservedData[bus._id] = allSeats.slice(0, reservedCount)
      localStorage.setItem("reservedSeats", JSON.stringify(reservedData))
    }
    setReservedSeats(reservedData[bus._id])
  }, [bus._id, bus.totalSeats])

  // Handle seat toggle
  const toggleSeat = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return // Ignore booked seats
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seatNumber))
    } else {
      if (selectedSeats.length < maxPassengers) {
        setSelectedSeats((prev) => [...prev, seatNumber])
      } else {
        // If trying to select more than maxPassengers, show alert
        alert(`You can only select up to ${maxPassengers} seat${maxPassengers > 1 ? 's' : ''} for this booking.`)
      }
    }
  }

  // Proceed to payment
  const handleProceedToPay = () => {
    // Calculate prices
    const basePrice = bus.fare * selectedSeats.length
    const gstAmount = basePrice * 0.05
    const totalAmount = basePrice + gstAmount

    // Ensure we have a valid travel date
    const validTravelDate = travelDate || new Date().toISOString().split('T')[0];
    
    // Log the travel date being passed to payment
    console.log("Original travel date:", travelDate);
    console.log("Validated travel date being passed to payment:", validTravelDate);

    navigate("/payment", {
      state: {
        bus: {
          ...bus,
          price: bus.fare,
          departure: bus.departureTime,
          arrival: bus.arrivalTime,
          from: searchData?.from || bus.from,
          to: searchData?.to || bus.to,
          date: bus.date, // Include bus date for reference
        },
        selectedSeats,
        basePrice,
        gstAmount,
        finalPrice: totalAmount,
        travelDate: validTravelDate, // Use validated travel date
        searchData: searchData ? {
          ...searchData,
          date: validTravelDate // Ensure searchData has the valid date
        } : null,
      },
    })
  }

  const renderSeatButton = (seatNumber) => {
    if (seatNumber < 1 || seatNumber > (bus.totalSeats || 40)) return null

    const isBooked = bookedSeats.includes(seatNumber)
    const isReserved = reservedSeats && reservedSeats.includes(seatNumber)
    const isSelected = selectedSeats.includes(seatNumber)
    let bgColor = "bg-green-400 hover:bg-green-500" // Available seats
    let textColor = "text-gray-800"
    let cursor = "cursor-pointer"

    if (isReserved) {
      bgColor = "bg-gray-400 text-white cursor-not-allowed" // Reserved seats in GREY
      cursor = "cursor-not-allowed"
    } else if (isBooked) {
      bgColor = "bg-red-600 text-white cursor-not-allowed" // Booked seats in RED
      cursor = "cursor-not-allowed"
    } else if (isSelected) {
      bgColor = "bg-blue-500 text-white ring-2 ring-blue-300" // Selected seats in BLUE with highlight
      textColor = "text-white"
    }

    return (
      <button
        key={seatNumber}
        onClick={() => !isReserved && !isBooked && toggleSeat(seatNumber)}
        disabled={isBooked || isReserved}
        className={`w-10 h-10 rounded text-sm font-medium transition-all duration-200 ${bgColor} ${textColor} ${cursor}`}
        title={
          isBooked
            ? "Seat is booked"
            : isReserved
              ? "Seat is reserved"
              : isSelected
                ? "Click to deselect"
                : "Click to select"
        }
      >
        {seatNumber}
      </button>
    )
  }

  const renderSeats = () => {
    const totalSeats = bus.totalSeats || 40
    const rows = []
    const seatsPerRow = 4
    const numFullRows = Math.floor(totalSeats / seatsPerRow)
    const remainingSeats = totalSeats % seatsPerRow

    // Render full rows
    for (let i = 0; i < numFullRows; i++) {
      const leftRow = []
      const rightRow = []
      for (let j = 0; j < 2; j++) {
        const leftSeat = i * seatsPerRow + j + 1
        const rightSeat = i * seatsPerRow + j + 3
        leftRow.push(renderSeatButton(leftSeat))
        rightRow.push(renderSeatButton(rightSeat))
      }
      rows.push(
        <div key={i} className="flex gap-10 justify-center mb-2">
          <div className="flex gap-2">{leftRow}</div>
          <div className="flex gap-2">{rightRow}</div>
        </div>,
      )
    }

    // Render remaining seats in the last row
    if (remainingSeats > 0) {
      const lastRow = []
      for (let i = 0; i < remainingSeats; i++) {
        const seatNumber = numFullRows * seatsPerRow + i + 1
        lastRow.push(renderSeatButton(seatNumber))
      }
      rows.push(
        <div key="last-row" className="flex justify-center mb-2">
          <div className="flex gap-2">{lastRow}</div>
        </div>,
      )
    }

    return rows
  }

  // Calculate prices
  const basePrice = bus.fare * selectedSeats.length
  const gstAmount = basePrice * 0.05
  const totalAmount = basePrice + gstAmount

  return (
    <div className="min-h-screen p-6 bg-[#FFF1E9]">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">{bus.name}</h1>
        <p className="text-gray-700">Departure: {bus.departureTime}</p>
        <p className="text-gray-700">Arrival: {bus.arrivalTime}</p>
        <p className="text-gray-700">Bus Type: {bus.type || "N/A"}</p>
        <p className="text-gray-700 mb-6">Price per seat: ₹{bus.fare}</p>

        {/* Seat Legend */}
        <div className="flex flex-wrap gap-6 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-green-400 inline-block border border-green-600"></span>
            <span className="text-gray-700 text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-red-600 inline-block border border-red-700"></span>
            <span className="text-gray-700 text-sm">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-500 ring-2 ring-blue-300 inline-block border border-blue-700"></span>
            <span className="text-gray-700 text-sm">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-gray-400 inline-block border border-gray-500"></span>
            <span className="text-gray-700 text-sm">Reserved</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">Select Your Seats</h2>
        <p className="text-gray-600 mb-4">You can select up to {maxPassengers} seat{maxPassengers > 1 ? 's' : ''} for this booking.</p>
        <div className="mb-6">{renderSeats()}</div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-lg font-medium">
          <div>
            Selected Seats: {selectedSeats.join(", ") || "None"} (Max: {maxPassengers})
            {selectedSeats.length > 0 && (
              <div className="text-sm text-gray-600 mt-1">Total: ₹{totalAmount.toFixed(2)}</div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            disabled={selectedSeats.length === 0}
            onClick={handleProceedToPay}
            className="bg-blue-700 px-6 py-2 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>💳</span>
            Proceed to Pay
          </button>
        </div>
      </div>
    </div>
  )
}

export default SeatBooking
