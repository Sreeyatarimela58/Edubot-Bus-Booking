require("dotenv").config()
const mongoose = require("mongoose")
const Bus = require("./models/busModel")

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bus-booking")

async function migrateBusNumbers() {
  try {
    console.log("🔍 Starting bus number migration...")
    
    // Find all buses without numbers
    const busesWithoutNumbers = await Bus.find({ 
      $or: [
        { number: { $exists: false } },
        { number: null },
        { number: "" }
      ]
    })
    
    console.log(`📊 Found ${busesWithoutNumbers.length} buses without numbers`)
    
    if (busesWithoutNumbers.length === 0) {
      console.log("✅ All buses already have numbers!")
      return
    }
    
    // Get all existing bus numbers to avoid conflicts
    const existingNumbers = await Bus.find({ 
      number: { $exists: true, $ne: null, $ne: "" }
    }).distinct('number')
    
    console.log(`📋 Existing bus numbers: ${existingNumbers.join(', ')}`)
    
    // Generate new numbers for buses without numbers
    let counter = 1
    for (const bus of busesWithoutNumbers) {
      let newNumber
      do {
        newNumber = `BUS${counter.toString().padStart(3, "0")}`
        counter++
      } while (existingNumbers.includes(newNumber))
      
      // Update the bus with the new number
      await Bus.findByIdAndUpdate(bus._id, { number: newNumber })
      console.log(`✅ Updated bus "${bus.name}" with number: ${newNumber}`)
    }
    
    console.log("🎉 Bus number migration completed successfully!")
    
  } catch (error) {
    console.error("❌ Error during migration:", error)
  } finally {
    await mongoose.connection.close()
    console.log("📌 MongoDB connection closed")
  }
}

migrateBusNumbers() 