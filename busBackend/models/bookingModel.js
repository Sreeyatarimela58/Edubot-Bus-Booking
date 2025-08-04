const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Bus",
    },
    // Added fields to store bus details directly in the booking
    busName: {
      type: String,
      required: true,
    },
    busNumber: {
      type: String,
      required: true,
    },
    busType: {
      type: String,
      enum: ["AC", "Non-AC", "Sleeper"],
      required: true,
    },
    busFrom: {
      type: String,
      required: true,
    },
    busTo: {
      type: String,
      required: true,
    },
    seatsBooked: {
      type: [Number],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    travelDate: {
      type: Date,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Completed",
    },
    paymentMethod: {
      type: String,
      enum: ["Credit Card", "Debit Card", "UPI", "Net Banking"],
      default: "Credit Card",
    },
    status: {
      type: String,
      enum: ["Confirmed", "Cancelled", "Pending"],
      default: "Confirmed",
    },
  },
  {
    timestamps: true,
  },
)

const Booking = mongoose.model("Booking", bookingSchema)

module.exports = Booking
