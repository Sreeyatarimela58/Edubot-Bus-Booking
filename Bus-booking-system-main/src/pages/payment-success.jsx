import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookSeat } from '../api/api';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { bus, selectedSeats, finalPrice, travelDate } = location.state || {};

  useEffect(() => {
    // Validate that we have all required data
    if (!bus || !selectedSeats || !finalPrice || !travelDate) {
      setError('Missing booking information. Please try again.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }
    
    const createBooking = async () => {
      try {
        // Check if user is logged in
        const userStr = localStorage.getItem("user");
        console.log('User data from localStorage:', userStr);
        
        if (!userStr || userStr === "undefined") {
          console.error('No user data found in localStorage');
          setError('Authentication error. Please login again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        let user;
        try {
          user = JSON.parse(userStr);
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError);
          setError('Invalid user data. Please login again.');
          localStorage.removeItem('user'); // Clear invalid data
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (!user || !user.token) {
          console.error('No user token found');
          setError('Authentication error. Please login again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        console.log('Creating booking with token:', user.token);
        
        // Create booking through API
        const response = await bookSeat({
          busId: bus._id,
          seatsBooked: selectedSeats,
          totalAmount: finalPrice,
          travelDate: travelDate,
          paymentMethod: location.state?.paymentMethod || 'Credit Card',
          paymentStatus: 'Completed'
        });

        // Store booking in localStorage for immediate display
        const myBookings = JSON.parse(localStorage.getItem('myBookings')) || [];
        myBookings.push({
          id: Date.now(),
          bus: bus,
          seats: selectedSeats,
          amount: finalPrice,
          date: travelDate,
          status: 'Confirmed'
        });
        localStorage.setItem('myBookings', JSON.stringify(myBookings));
      } catch (err) {
        console.error('Error creating booking:', err);
        setError(err.response?.data?.message || 'Failed to create booking');
      }
    };

    if (bus && selectedSeats) {
      createBooking();
    }
  }, [bus, selectedSeats, finalPrice, travelDate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Booking Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Successful!</h2>
          <p className="text-gray-600 mb-8">
            Your booking has been confirmed. You can view your booking details in My Bookings.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/mybookings')}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;