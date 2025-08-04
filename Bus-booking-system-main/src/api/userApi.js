// src/api/userApi.js
import axios from "axios";

const API_URL = "https://edubot-bus-booking.onrender.com/api";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Helper function to get user token from localStorage
const getUserToken = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      console.warn("No user data found in localStorage");
      return null;
    }
    
    const user = JSON.parse(userStr);
    if (!user || !user.token) {
      console.warn("No token found in user data");
      return null;
    }
    
    return user.token;
  } catch (error) {
    console.error("Error getting user token:", error);
    return null;
  }
};

// Add auth header to requests
api.interceptors.request.use(
  (config) => {
    const token = getUserToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized request - clearing user data");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Book a seat
export const bookSeat = async (bookingData) => {
  try {
    const token = getUserToken();
    if (!token) {
      throw new Error("Authentication required. Please login.");
    }
    
    const response = await api.post("/bookings", bookingData);
    return response;
  } catch (error) {
    console.error("Error booking seat:", error);
    throw error;
  }
};

// Get user's bookings
export const getMyBookings = async () => {
  try {
    const token = getUserToken();
    if (!token) {
      throw new Error("Authentication required. Please login.");
    }
    
    const response = await api.get("/bookings/my");
    console.log(response.data.bookings);
    return response.data.bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

// Cancel a booking
export const cancelBooking = async (bookingId) => {
  try {
    const token = getUserToken();
    if (!token) {
      throw new Error("Authentication required. Please login.");
    }
    
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error("Error canceling booking:", error);
    throw error;
  }
};