"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { bookSeat } from "../api/api"

const Payment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { bus, selectedSeats } = location.state || {}

  const [payClicked, setPayClicked] = useState(false)
  const [travelDate, setTravelDate] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState("Credit Card")
  const [processing, setProcessing] = useState(false)

  // Format travel date as DD/MM/YYYY
  const formatTravelDate = (dateString) => {
    if (!dateString) return "Not specified"
    
    console.log("Formatting travel date:", dateString)
    
    // Try to parse as Date object first
    try {
      // Handle string dates in various formats
      if (typeof dateString === 'string') {
        // Check if already in DD/MM/YYYY format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
          return dateString
        }
        
        // Try to match YYYY-MM-DD format
        const isoMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/)
        if (isoMatch) {
          const [_, y, m, d] = isoMatch
          return `${d}/${m}/${y}`
        }
      }
      
      // Try to create a Date object
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        // Valid date object, format as DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
      }
    } catch (error) {
      console.error("Error parsing date:", error)
    }
    
    // Return as is if no format matches
    return String(dateString)
  }

  useEffect(() => {
    let tDate = null
    
    // Debug all possible date sources
    console.log("Date sources:", {
      "location.state.travelDate": location.state?.travelDate,
      "location.state.searchData.date": location.state?.searchData?.date,
      "location.state.date": location.state?.date,
      "bus.date": bus?.date
    })
    
    // First priority: Check for travelDate directly in location.state
    if (location.state?.travelDate) {
      tDate = location.state.travelDate
      console.log("Using travelDate from location.state:", tDate)
    } 
    // Second priority: Check for date in searchData
    else if (location.state?.searchData?.date) {
      tDate = location.state.searchData.date
      console.log("Using date from searchData:", tDate)
    } 
    // Third priority: Check for date directly in location.state
    else if (location.state?.date) {
      tDate = location.state.date
      console.log("Using date directly from location.state:", tDate)
    } 
    // Fourth priority: Check for date in bus object
    else if (bus?.date) {
      tDate = bus.date
      console.log("Using date from bus object:", tDate)
    }
    
    // Fallback to lastSearch in localStorage
    if (!tDate) {
      try {
        const lastSearch = JSON.parse(localStorage.getItem("lastSearch"))
        if (lastSearch?.date) {
          tDate = lastSearch.date
          console.log("Using date from localStorage:", tDate)
        }
      } catch (error) {
        console.error("Error reading from localStorage:", error)
      }
    }
    
    // Ensure we have a valid date
    if (!tDate) {
      tDate = new Date().toISOString().split('T')[0] // Today's date as fallback
      console.log("No date found, using today's date:", tDate)
    }
    
    console.log("Final travel date being set:", tDate)
    setTravelDate(tDate)
  }, [location.state, bus])

  const handlePayment = async () => {
    if (payClicked) return // Prevent double click
    setPayClicked(true)
    setProcessing(true)

    // Check if user is logged in
    const userStr = localStorage.getItem("user")
    const user = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null
    if (!user) {
      alert("Please login to book tickets.")
      navigate("/login")
      return
    }

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // Calculate prices
        const basePrice = bus.fare * selectedSeats.length
        const gstAmount = basePrice * 0.05
        const totalAmount = basePrice + gstAmount

        // Create booking with payment completed status
        // Ensure travelDate is properly formatted for the API
        let formattedTravelDate;
        try {
          // Try to create a valid date object
          const dateObj = travelDate ? new Date(travelDate) : new Date();
          // Check if it's a valid date
          if (isNaN(dateObj.getTime())) {
            console.error("Invalid travel date, using current date instead:", travelDate);
            formattedTravelDate = new Date().toISOString();
          } else {
            formattedTravelDate = dateObj.toISOString();
          }
        } catch (error) {
          console.error("Error formatting travel date:", error);
          formattedTravelDate = new Date().toISOString();
        }
        
        console.log("Using formatted travel date for booking:", formattedTravelDate);
        
        // Add bus ID validation before creating booking data
        const busId = bus._id || bus.id;
        if (!busId || typeof busId !== 'string' || !busId.match(/^[0-9a-fA-F]{24}$/)) {
          alert("Invalid bus ID format. Please try booking again.");
          setPayClicked(false);
          setProcessing(false);
          return;
        }
        
        const bookingData = {
          busId: busId,
          seats: selectedSeats.map((seat) => Number.parseInt(seat)),
          totalAmount: totalAmount,
          travelDate: formattedTravelDate,
          paymentMethod: paymentMethod,
          paymentStatus: "Completed", // ✅ Explicitly set as Completed
        }
        console.log("Bus ID being used for booking:", bus._id || bus.id);
        console.log("Creating booking with data:", bookingData)

        // Log token for debugging
        console.log("Using token for booking:", user.token);
        
        // Use the bookSeat function imported at the top of the file
        // This ensures consistent token handling with proper authorization
        const response = await bookSeat(bookingData);
        
        // Axios response structure is different from fetch
        const data = response.data;
        
        if (response.status === 201 && data.success) {
          // Clear held seats if this booking came from held seats
          if (location.state?.fromHeldSeats) {
            try {
              const heldSeatsData = JSON.parse(localStorage.getItem("heldSeats") || "{}")
              if (heldSeatsData[bus._id]) {
                heldSeatsData[bus._id] = heldSeatsData[bus._id].filter(
                  (heldSeat) => !selectedSeats.includes(heldSeat.seatNumber),
                )
                if (heldSeatsData[bus._id].length === 0) {
                  delete heldSeatsData[bus._id]
                }
                localStorage.setItem("heldSeats", JSON.stringify(heldSeatsData))
              }
            } catch (error) {
              console.error("Error clearing held seats:", error)
            }
          }

          // Navigate to success page
          navigate("/payment-success", {
            state: {
              bus,
              finalPrice: totalAmount,
              selectedSeats,
              seatNumbers: selectedSeats,
              travelDate,
              basePrice,
              gstAmount,
              bookingId: data.booking._id,
              paymentMethod,
            },
          })
        } else {
          throw new Error(data.message || "Booking failed")
        }
      } catch (error) {
        console.error("Payment/Booking error:", error)
        
        // Check for specific error types
        let errorMessage = "Payment failed. Please try again.";
        
        if (error.response) {
          console.log("Error response:", error.response.data);
          errorMessage = error.response.data.message || errorMessage;
          
          // Handle token errors
          if (error.response.status === 401) {
            errorMessage = "Your session has expired. Please login again.";
            // Clear invalid token
            localStorage.removeItem("user");
            setTimeout(() => navigate("/login"), 2000);
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        alert(errorMessage);
        setPayClicked(false);
        setProcessing(false);
      }
    }, 2000) // 2 second delay to simulate processing
  }

  if (!bus || !selectedSeats || (!bus.fare && !bus.price)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600">Invalid booking data. Please start your booking again.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Calculate prices - use fare if available, otherwise use price
  const farePrice = bus.fare || bus.price || 0
  const basePrice = farePrice * selectedSeats.length
  const gstAmount = basePrice * 0.05
  const totalAmount = basePrice + gstAmount

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <h2 className="text-2xl font-bold text-center">Complete Your Payment</h2>
        </div>

        {/* Bus Details */}
        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Bus Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <p>
                <span className="font-medium">Bus Name:</span> {bus.name} {bus.type ? `(${bus.type})` : ""}
              </p>
              <p>
                <span className="font-medium">Travel Date:</span> {formatTravelDate(travelDate)}
              </p>
              <p>
                <span className="font-medium">From:</span>{" "}
                {bus.from || location.state?.searchData?.from || "Not specified"}
              </p>
              <p>
                <span className="font-medium">To:</span> {bus.to || location.state?.searchData?.to || "Not specified"}
              </p>
              <p>
                <span className="font-medium">Departure:</span> {bus.departureTime || bus.departure || "Not specified"}
              </p>
              <p>
                <span className="font-medium">Arrival:</span> {bus.arrivalTime || bus.arrival || "Not specified"}
              </p>
            </div>
          </div>

          {/* Seat Details */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Seat Details</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Selected Seats:</span> {selectedSeats.join(", ")}
              </p>
              <p>
                <span className="font-medium">Price per Seat:</span> ₹{bus.fare || bus.price || 0}
              </p>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
            <div className="space-y-3">
              {["Credit Card", "Debit Card", "UPI", "Net Banking"].map((method) => (
                <label key={method} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Price Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Fare ({selectedSeats.length} seats)</span>
                <span>₹{basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (5%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total Amount</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="text-center pt-4">
            {processing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="text-gray-600">Processing Payment...</span>
              </div>
            ) : (
              <button
                className={`w-full md:w-auto px-8 py-3 bg-green-600 text-white rounded-lg font-semibold
                  hover:bg-green-700 transition-colors ${payClicked ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handlePayment}
                disabled={payClicked}
              >
                {payClicked ? "Processing..." : `Pay ₹${totalAmount.toFixed(2)} via ${paymentMethod}`}
              </button>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 p-4 rounded-lg text-center text-green-700 text-sm">
            <p>🔒 Your payment is secure and encrypted</p>
            <p>This is a demo payment - no real money will be charged</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
