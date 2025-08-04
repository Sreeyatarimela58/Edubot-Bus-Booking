const mongoose = require("mongoose")

const busSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: [true, "Bus number is required"],
      trim: true,
      unique: true, // Primary key - ensures uniqueness
      maxlength: [20, "Bus number cannot exceed 20 characters"],
    },
    name: {
      type: String,
      required: [true, "Bus name is required"],
      trim: true,
      maxlength: [100, "Bus name cannot exceed 100 characters"],
    },
    from: {
      type: String,
      required: [true, "Departure city is required"],
    },
    to: {
      type: String,
      required: [true, "Arrival city is required"],
    },
    date: {
      type: String, // Changed to String to avoid timezone issues
      required: [true, "Date is required"],
    },
    departureTime: {
      type: String,
      required: [true, "Departure time is required"],
    },
    arrivalTime: {
      type: String,
      required: [true, "Arrival time is required"],
    },
    totalSeats: {
      type: Number,
      required: [true, "Total seats is required"],
      min: [10, "Minimum 10 seats are required"],
      max: [60, "Maximum 60 seats are allowed"],
      default: 40,
    },
    fare: {
      type: Number,
      required: [true, "Fare is required"],
      min: [100, "Minimum fare should be 100"],
    },
    type: {
      type: String,
      enum: ["AC", "Non-AC", "Sleeper"],
      default: "AC",
    },
    amenities: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 amenities are allowed",
      },
      default: [],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.0,
    },
    bookedSeats: {
      type: [Number],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Create a unique index on number field (primary key)
busSchema.index({ number: 1 }, { unique: true })

const Bus = mongoose.model("Bus", busSchema)

module.exports = Bus
