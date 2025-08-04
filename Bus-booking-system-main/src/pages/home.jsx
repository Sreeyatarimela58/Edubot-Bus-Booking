"use client"

// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, Calendar, Users, Clock, Shield, Star, Bus } from "lucide-react"

// Popular South Indian cities
export const POPULAR_CITIES = ["Bangalore", "Hyderabad", "Chennai"]

// Generate bus data
export const BUS_TYPES = ["Sleeper", "AC", "Non-AC"]
export const BUS_TYPE_MULTIPLIER = { Sleeper: 2.0, AC: 1.5, "Non-AC": 1.0 }

// Simple city-to-city distance map (in km, rough estimates)
export const CITY_DISTANCES = {
  "Bangalore-Hyderabad": 570,
  "Hyderabad-Bangalore": 570,
  "Bangalore-Chennai": 350,
  "Chennai-Bangalore": 350,
}

// Generate 3-4 buses for every city-to-city route (no duplicates, both directions)
const allRoutes = []
for (let i = 0; i < POPULAR_CITIES.length; i++) {
  for (let j = 0; j < POPULAR_CITIES.length; j++) {
    if (i !== j) allRoutes.push([POPULAR_CITIES[i], POPULAR_CITIES[j]])
  }
}

const BUS_NAMES = [
  "Express Travels",
  "Luxury Coach",
  "City Express",
  "Royal Travels",
  "Speed Bus",
  "Comfort Ride",
  "Metro Express",
  "Highway King",
  "Swift Travels",
  "Golden Express",
  "Silver Line",
  "Diamond Coach",
]

// For each route, generate 7-8 buses with at least one Sleeper, one AC, and one Non-AC, and randomize the rest
export const BUSES = allRoutes.flatMap(([from, to], routeIdx) => {
  const numBuses = 4 // 7 or 8 buses
  // Ensure at least one of each type
  const types = ["Sleeper", "AC", "Non-AC"]
  // Fill the rest randomly
  while (types.length < numBuses) {
    types.push(BUS_TYPES[Math.floor(Math.random() * BUS_TYPES.length)])
  }
  // Shuffle types for variety
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[types[i], types[j]] = [types[j], types[i]]
  }
  // Shuffle bus names for this route to avoid same order for reverse
  const shuffledNames = [...BUS_NAMES]
  for (let i = shuffledNames.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]]
  }
  return types.map((type, i) => {
    const routeKey = `${from}-${to}`
    const distance =
      CITY_DISTANCES[routeKey] || CITY_DISTANCES[`${to}-${from}`] || 300 + Math.floor(Math.random() * 400)
    // Price base for each type, with some random variation
    const basePrice = Math.round(distance * 0.8)
    let price
    if (type === "Sleeper") {
      price = Math.round(basePrice * 2.0 + Math.random() * 100 + 100) // always highest
    } else if (type === "AC") {
      price = Math.round(basePrice * 1.5 + Math.random() * 80 + 60)
    } else {
      price = Math.round(basePrice * 1.0 + Math.random() * 50 + 30) // always lowest
    }
    // Randomize departure hour for each direction and bus, now 5:00 to 23:00
    const depHour = 6 + Math.floor(Math.random() * 17) // 5 to 23
    const arrHour = (depHour + Math.floor(distance / 100) + 4 + Math.floor(Math.random() * 2)) % 24
    const depMin = Math.floor(Math.random() * 60)
    const arrMin = Math.floor(Math.random() * 60)
    const pad = (n) => n.toString().padStart(2, "0")
    const name = shuffledNames[i % shuffledNames.length]
    return {
      id: routeIdx * 20 + i + 1,
      serviceNumber: 2000 + routeIdx * 20 + i,
      name,
      from,
      to,
      type,
      departureTime: `${pad(depHour)}:${pad(depMin)}`,
      arrivalTime: `${pad(arrHour)}:${pad(arrMin)}`,
      fare: price,
      totalSeats: 40,
      bookedSeats: [],
      amenities: ["wifi", "charging point", "water bottle", "ac"],
      rating: 4.5,
      date: new Date(),
      number: `BUS${(routeIdx * 20 + i + 1).toString().padStart(3, "0")}`,
      isActive: true,
    }
  })
})

export default function Home() {
  const navigate = useNavigate()
  const getToday = () => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  }

  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 10)
  }

  // Function to get the minimum selectable date
  // If it's too late in the day, return tomorrow's date instead of today
  const getMinSelectableDate = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // If it's late in the day (e.g., after 10 PM), set minimum to tomorrow
    // Or if most buses for the day have likely already departed
    if (currentHour >= 22 || (currentHour >= 20 && currentMinute >= 30)) {
      return getTomorrow()
    }

    return getToday()
  }

  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen, setToOpen] = useState(false)
  const [fromSearch, setFromSearch] = useState("")
  const [toSearch, setToSearch] = useState("")
  const fromRef = useRef()
  const toRef = useRef()

  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    date: getMinSelectableDate(),
    passengers: 1,
    busType: "all", // "all", "AC", "Non-AC"
  })

  // Save searchData to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem("lastSearch", JSON.stringify(searchData))
  }, [searchData])

  useEffect(() => {
    const handler = (e) => {
      if (fromRef.current && !fromRef.current.contains(e.target)) setFromOpen(false)
      if (toRef.current && !toRef.current.contains(e.target)) setToOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSearch = () => {
    if (searchData.from && searchData.to && searchData.date) {
      console.log("Searching with data:", searchData)
      localStorage.setItem("lastSearch", JSON.stringify(searchData))
      navigate("/search", { state: searchData })
    } else {
      alert("Please select origin, destination and date")
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF1E9] pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-2">
          India's No. 1 Online Bus Ticket Booking Site
        </h1>
        <p className="text-center text-lg text-gray-600 mb-8">Book bus tickets online in just a few clicks</p>
        {/* Search Box */}
        <div className="flex flex-col items-center justify-center gap-4 bg-white/80 rounded-xl shadow-lg p-6 mb-10 w-full max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row w-full gap-4">
            {/* From City */}
            <div className="relative w-full md:w-56" ref={fromRef}>
              <button
                className="flex items-center w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:outline-none"
                onClick={() => setFromOpen((v) => !v)}
                type="button"
              >
                <MapPin className="mr-2 text-[#e57373]" size={20} />
                {searchData.from || "From"}
              </button>
              {fromOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <input
                    className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                    placeholder="Search city..."
                    value={fromSearch}
                    onChange={(e) => setFromSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="py-1">
                    <div className="px-3 py-1 text-xs text-gray-400">Popular Cities</div>
                    {POPULAR_CITIES.filter(
                      (city) => city.toLowerCase().includes(fromSearch.toLowerCase()) && city !== searchData.to,
                    ).map((city) => (
                      <div
                        key={city}
                        className="flex items-center px-3 py-2 hover:bg-[#ffe0e0] cursor-pointer"
                        onClick={() => {
                          setSearchData((sd) => ({ ...sd, from: city }))
                          setFromOpen(false)
                          setFromSearch("")
                        }}
                      >
                        <Bus className="mr-2 text-[#e57373]" size={16} /> {city}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* To City */}
            <div className="relative w-full md:w-56" ref={toRef}>
              <button
                className="flex items-center w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-700 focus:outline-none"
                onClick={() => setToOpen((v) => !v)}
                type="button"
              >
                <MapPin className="mr-2 text-[#e57373]" size={20} />
                {searchData.to || "To"}
              </button>
              {toOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <input
                    className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                    placeholder="Search city..."
                    value={toSearch}
                    onChange={(e) => setToSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="py-1">
                    <div className="px-3 py-1 text-xs text-gray-400">Popular Cities</div>
                    {POPULAR_CITIES.filter(
                      (city) => city.toLowerCase().includes(toSearch.toLowerCase()) && city !== searchData.from,
                    ).map((city) => (
                      <div
                        key={city}
                        className="flex items-center px-3 py-2 hover:bg-[#ffe0e0] cursor-pointer"
                        onClick={() => {
                          setSearchData((sd) => ({ ...sd, to: city }))
                          setToOpen(false)
                          setToSearch("")
                        }}
                      >
                        <Bus className="mr-2 text-[#e57373]" size={16} /> {city}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Date */}
            <div className="w-full md:w-48">
              <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 bg-white">
                <Calendar className="mr-2 text-[#e57373]" size={20} />
                <input
                  type="date"
                  className="w-full bg-transparent focus:outline-none"
                  value={searchData.date}
                  min={getMinSelectableDate()}
                  onChange={(e) => setSearchData((sd) => ({ ...sd, date: e.target.value }))}
                />
              </div>
              {/* Show selected date below the calendar input, styled properly */}
              <div className="mt-1 text-center text-gray-700 text-sm font-medium">
                {searchData.date ? `Travelling Date: ${searchData.date}` : ""}
              </div>
            </div>
            {/* Passengers */}
            <div className="w-full md:w-56">
              <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 bg-white">
                <Users className="mr-2 text-[#e57373]" size={20} />
                <select
                  className="w-full min-w-[120px] bg-transparent focus:outline-none"
                  value={searchData.passengers}
                  onChange={(e) => setSearchData((sd) => ({ ...sd, passengers: Number(e.target.value) }))}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} Passenger{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bus Type Filter */}
          <div className="w-full flex flex-col items-center gap-3">
            <div className="text-sm font-medium text-gray-700">Filter by Bus Type:</div>
            <div className="flex gap-3">
              <button
                className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                  searchData.busType === "all"
                    ? "bg-[#e57373] text-white border-[#e57373]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#e57373] hover:text-[#e57373]"
                }`}
                onClick={() => setSearchData((sd) => ({ ...sd, busType: "all" }))}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚌</span>
                  <span>All Buses</span>
                </div>
              </button>
              <button
                className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                  searchData.busType === "AC"
                    ? "bg-[#e57373] text-white border-[#e57373]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#e57373] hover:text-[#e57373]"
                }`}
                onClick={() => setSearchData((sd) => ({ ...sd, busType: "AC" }))}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">❄️</span>
                  <span>AC Buses</span>
                </div>
              </button>
              <button
                className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                  searchData.busType === "Non-AC"
                    ? "bg-[#e57373] text-white border-[#e57373]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#e57373] hover:text-[#e57373]"
                }`}
                onClick={() => setSearchData((sd) => ({ ...sd, busType: "Non-AC" }))}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌡️</span>
                  <span>Non-AC Buses</span>
                </div>
              </button>
            </div>
          </div>

          {/* Search Button - always below the fields */}
          <button
            className="w-full md:w-1/2 bg-[#e57373] hover:bg-[#d45d5d] text-white font-semibold rounded-lg px-6 py-2 transition"
            onClick={handleSearch}
          >
            Search Buses
          </button>
        </div>
        {/* Popular Routes Section - restored as in your screenshot */}
        <h2 className="text-3xl font-bold text-[#a05252] flex items-center gap-2 mb-8 mt-12">
          <span className="text-4xl">⭐</span>Popular Routes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Example static popular routes, can be replaced with dynamic if needed */}
          {[
            {
              from: "Bangalore",
              to: "Hyderabad",
              name: "Express Travels",
              type: "Sleeper",
              departureTime: "12:23",
              arrivalTime: "19:38",
              fare: 1140,
              number: "BUS001",
            },
            {
              from: "Bangalore",
              to: "Hyderabad",
              name: "Luxury Coach",
              type: "AC",
              departureTime: "14:55",
              arrivalTime: "21:06",
              fare: 855,
              number: "BUS002",
            },
            {
              from: "Bangalore",
              to: "Hyderabad",
              name: "City Express",
              type: "Non-AC",
              departureTime: "07:22",
              arrivalTime: "14:31",
              fare: 570,
              number: "BUS003",
            },
            {
              from: "Bangalore",
              to: "Chennai",
              name: "Royal Travels",
              type: "Sleeper",
              departureTime: "18:18",
              arrivalTime: "23:03",
              fare: 700,
              number: "BUS004",
            },
            {
              from: "Bangalore",
              to: "Chennai",
              name: "Speed Bus",
              type: "AC",
              departureTime: "16:45",
              arrivalTime: "21:23",
              fare: 525,
              number: "BUS005",
            },
            {
              from: "Bangalore",
              to: "Chennai",
              name: "Comfort Ride",
              type: "Non-AC",
              departureTime: "15:19",
              arrivalTime: "20:06",
              fare: 350,
              number: "BUS006",
            },
          ].map((route, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-2 border border-gray-100">
              <div className="flex items-center gap-2 text-lg font-semibold text-[#a05252]">
                <Bus className="text-[#e57373]" size={20} />
                {route.from} <span className="text-gray-400">→</span> {route.to}
                <span className="ml-auto text-[#e57373] text-xl">🚌</span>
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span className="font-medium">{route.name}</span> | {route.type}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Clock className="text-gray-400" size={16} />
                {route.departureTime} - {route.arrivalTime}{" "}
                <span className="ml-2 font-bold text-lg text-[#a05252]">₹{route.fare}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <Shield className="text-[#e57373] mb-2" size={32} />
            <div className="font-semibold text-lg">Safe & Secure Booking</div>
            <div className="text-gray-500">Your data and payments are protected with industry-leading security.</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <Star className="text-[#e57373] mb-2" size={32} />
            <div className="font-semibold text-lg">Top Rated Operators</div>
            <div className="text-gray-500">We partner with the best bus operators for a comfortable journey.</div>
          </div>
          <div className="flex flex-col items-center text-center">
            <Clock className="text-[#e57373] mb-2" size={32} />
            <div className="font-semibold text-lg">24x7 Customer Support</div>
            <div className="text-gray-500">Our team is here to help you anytime, anywhere.</div>
          </div>
        </div>

        {/* Customer Testimonials Section */}
        <div className="mt-20 mb-8 px-2">
          <div className="max-w-7xl mx-auto bg-[#fff7f7] rounded-2xl py-10 px-2 md:px-8 border border-[#ffe0e0] shadow-sm">
            <div className="flex flex-col items-center mb-8">
              <span className="text-4xl mb-2" role="img" aria-label="heart">
                ❤️
              </span>
              <h2 className="text-3xl font-bold text-[#a05252]">Customer Testimonials</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl border border-[#ffe0e0] shadow p-6 flex flex-col justify-between">
                <div className="text-gray-700 italic mb-4">
                  "<span className="not-italic">Booking was quick and hassle-free!</span>"
                </div>
                <div className="font-bold text-[#a05252] text-lg">Rahul S.</div>
              </div>
              <div className="bg-white rounded-xl border border-[#ffe0e0] shadow p-6 flex flex-col justify-between">
                <div className="text-gray-700 italic mb-4">
                  "<span className="not-italic">Very clean buses and great service.</span>"
                </div>
                <div className="font-bold text-[#a05252] text-lg">Priya D.</div>
              </div>
              <div className="bg-white rounded-xl border border-[#ffe0e0] shadow p-6 flex flex-col justify-between">
                <div className="text-gray-700 italic mb-4">
                  "<span className="not-italic">On-time departure and arrival, will book again!"</span>"
                </div>
                <div className="font-bold text-[#a05252] text-lg">Arjun M.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
