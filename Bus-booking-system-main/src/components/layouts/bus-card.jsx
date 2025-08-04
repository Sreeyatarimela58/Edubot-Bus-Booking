"use client"
import { Clock, Bus } from "lucide-react"
import { useNavigate } from "react-router-dom"

const BusCard = ({ bus, onSelect }) => {
  const navigate = useNavigate()
  
  // Log the bus object to see its structure
  console.log("Bus object in BusCard:", bus)

  const handleBusSelect = () => {
    // Get search data from localStorage to retrieve passenger count
    const searchData = JSON.parse(localStorage.getItem("lastSearch")) || { passengers: 1 }
    const passengers = searchData.passengers || 1
    
    // Log the date and passenger count being passed to seat booking
    console.log("Bus date being passed to seat booking:", bus.date)
    console.log("Passenger count being passed to seat booking:", passengers)
    
    // Ensure we have a valid date to pass
    const validDate = bus.date || new Date().toISOString().split('T')[0];
    console.log("Validated date for seat booking:", validDate);
    
    navigate("/seats", {
      state: {
        bus,
        passengers: passengers, // Pass the passenger count from search data
        searchData: { from: bus.from, to: bus.to, date: validDate, passengers: passengers },
        travelDate: validDate, // Explicitly pass travelDate
      },
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-2 border border-gray-100">
      <div className="flex items-center gap-2 text-lg font-semibold text-[#a05252]">
        <Bus className="text-[#e57373]" size={20} />
        {bus.name}
        <span className="ml-auto text-[#e57373] text-xl">🚌</span>
      </div>
      <div className="text-sm text-gray-600 flex items-center gap-2">
        <span className="font-medium">
          {bus.from} <span className="text-gray-400">→</span> {bus.to}
        </span>{" "}
        | {bus.type}
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <Clock className="text-gray-400" size={16} />
        {bus.departureTime} - {bus.arrivalTime}{" "}
        <span className="ml-2 font-bold text-lg text-[#a05252]">₹{bus.fare}</span>
      </div>
      <button
        className="mt-2 bg-[#e57373] hover:bg-[#d45d5d] text-white rounded-lg px-4 py-2 font-semibold transition"
        onClick={handleBusSelect}
      >
        Select Seats
      </button>
    </div>
  )
}

export default BusCard
