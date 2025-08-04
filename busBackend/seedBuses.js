require("dotenv").config()
const mongoose = require("mongoose")
const Bus = require("./models/busModel")

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bus-booking")

const POPULAR_ROUTES = [
  { from: "Bangalore", to: "Hyderabad" },
  { from: "Hyderabad", to: "Bangalore" },
  { from: "Bangalore", to: "Chennai" },
  { from: "Chennai", to: "Bangalore" },
]

const BUS_TYPES = ["AC", "Non-AC"]
const DEPARTURE_TIMES = ["06:00", "10:00", "14:00", "18:00", "22:00", "08:00"]

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

function calculateArrivalTime(departureTime) {
  const [hours, minutes] = departureTime.split(":").map(Number)
  const travelHours = Math.floor(Math.random() * 3) + 6
  const arrivalHours = (hours + travelHours) % 24
  return `${arrivalHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

function generatePrice(route, busType) {
  let basePrice = 500
  if (route.from === "Bangalore" && route.to === "Hyderabad") basePrice = 800
  if (route.from === "Hyderabad" && route.to === "Bangalore") basePrice = 800
  if (route.from === "Bangalore" && route.to === "Chennai") basePrice = 600
  if (route.from === "Chennai" && route.to === "Bangalore") basePrice = 600

  if (busType === "AC") basePrice *= 1.5
  if (busType === "Sleeper") basePrice *= 1.8

  return Math.round(basePrice)
}

async function seedDatabase() {
  try {
    await Bus.deleteMany({})
    console.log("✅ Cleared existing bus data")

    const buses = []
    const today = new Date();

    for (let day = 0; day < 3; day++) {
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + day)

      const dateString = currentDate.toISOString().split("T")[0] // format YYYY-MM-DD
      const timestamp = new Date()

      for (let busIndex = 0; busIndex < 4; busIndex++) {
        const route = POPULAR_ROUTES[busIndex]
        const busName = BUS_NAMES[day * 4 + busIndex]
        const busType = BUS_TYPES[busIndex % BUS_TYPES.length]
        const departureTime = DEPARTURE_TIMES[busIndex]
        const arrivalTime = calculateArrivalTime(departureTime)
        const price = generatePrice(route, busType)

        const bus = {
          name: busName,
          number: `BUS${(day * 4 + busIndex + 1).toString().padStart(3, "0")}`,
          from: route.from,
          to: route.to,
          date: dateString,
          departureTime: departureTime,
          arrivalTime: arrivalTime,
          totalSeats: 40,
          bookedSeats: [],
          fare: price,
          type: busType,
          amenities: [],
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        buses.push(bus)
      }
    }

    await Bus.insertMany(buses)
    console.log("✅ Inserted all buses successfully")

    console.log("\n📋 Created Buses:")
    buses.forEach((bus, index) => {
      console.log(
        `${index + 1}. ${bus.name} (${bus.number}) - ${bus.from} to ${bus.to} on ${bus.date} at ${bus.departureTime} - ₹${bus.fare}`
      )
    })

    console.log("\n🚀 Database seeding completed successfully!")
    console.log(`📊 Total buses in database: ${buses.length}`)

    await mongoose.connection.close()
    console.log("📌 MongoDB connection closed")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    await mongoose.connection.close()
    console.log("📌 MongoDB connection closed")
    process.exit(1)
  }
}

seedDatabase()
