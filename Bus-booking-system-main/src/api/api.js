// src/services/api.js
import axios from "axios"

const API_URL = "https://edubot-bus-booking.onrender.com/api"

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
})

// Export the api instance directly
export { api }

// Helper function to get admin token from localStorage
const getAdminToken = () => {
  try {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      console.warn("No admin token found in localStorage")
      return null
    }
    return token
  } catch (error) {
    console.error("Error getting admin token:", error)
    return null
  }
}

// Add auth header to requests
api.interceptors.request.use(
  (config) => {
    const token = getAdminToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized request - clearing admin token")
      localStorage.removeItem("adminToken")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth services
const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials)
      if (response.data.user.isAdmin) {
        localStorage.setItem("adminToken", response.data.token)
        localStorage.setItem("adminUser", JSON.stringify(response.data.user))
        return response.data
      } else {
        throw new Error("User is not an admin")
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  },
  logout: () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
  },
  isAuthenticated: () => {
    return !!getAdminToken()
  },
}

// Admin services
const adminService = {
  getDashboardStats: async () => {
    try {
      const response = await api.get("/admin/dashboard-stats")
      return response.data.stats
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      throw error
    }
  },
  getBuses: async () => {
    try {
      const response = await api.get("/api/buses")
      return response.data.buses
    } catch (error) {
      console.error("Error fetching buses:", error)
      throw error
    }
  },
  addBus: async (busData) => {
    try {
      const response = await api.post("/admin/buses", busData)
      return response.data
    } catch (error) {
      console.error("Error adding bus:", error)
      throw error
    }
  },
  updateBus: async (busId, busData) => {
    try {
      const response = await api.put(`/admin/buses/${busId}`, busData)
      return response.data
    } catch (error) {
      console.error("Error updating bus:", error)
      throw error
    }
  },
  deleteBus: async (busId) => {
    try {
      const response = await api.delete(`/admin/buses/${busId}`)
      return response.data
    } catch (error) {
      console.error("Error deleting bus:", error)
      throw error
    }
  },
  getAllBookings: async (date, startDate, endDate) => {
    try {
      let url = "/admin/bookings"
      if (date) {
        url = `/admin/bookings?date=${date}`
      } else if (startDate && endDate) {
        url = `/admin/bookings?startDate=${startDate}&endDate=${endDate}`
      }
      const response = await api.get(url)

    } catch (error) {
      console.error("Error fetching bookings:", error)
      throw error
    }
  },
  clearAllBookings: async () => {
    try {
      const response = await api.delete("/admin/bookings/clear-all")
      return response.data
    } catch (error) {
      console.error("Error clearing bookings:", error)
      throw error
    }
  },
  getBusesForDate: async (date) => {
    try {
      const response = await api.get(`/admin/buses-by-date?date=${date}`)
      return response.data.buses
    } catch (error) {
      console.error("Error fetching buses for date:", error)
      throw error
    }
  },
  getBusesForDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/admin/buses-for-date-range?startDate=${startDate}&endDate=${endDate}`)
      return response.data.busSchedule
    } catch (error) {
      console.error("Error fetching buses for date range:", error)
      throw error
    }
  },
  getMonthlyBookings: async (year, month) => {
    try {
      const response = await api.get(`/admin/monthly-bookings?year=${year}&month=${month}`)
      return response.data.monthlySummary
    } catch (error) {
      console.error("Error fetching monthly bookings:", error)
      throw error
    }
  },
  getBusWeeklyStats: async (busId, startDate) => {
    try {
      const url = startDate
        ? `/admin/bus-weekly-stats/${busId}?startDate=${startDate}`
        : `/admin/bus-weekly-stats/${busId}`
      const response = await api.get(url)
      return response.data.weeklyStats
    } catch (error) {
      console.error("Error fetching bus weekly stats:", error)
      throw error
    }
  },
}

// User services
export const bookSeat = async (bookingData) => {
  try {
    // Get user token from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      throw new Error("Authentication required. Please login.");
    }
    
    const user = JSON.parse(userStr);
    if (!user || !user.token) {
      throw new Error("Authentication required. Please login.");
    }
    
    // Create a new instance with the user token
    const userApi = axios.create({
      baseURL: API_URL,
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });
    
    // Make the booking request
    const response = await userApi.post("/bookings", bookingData);
    return response;
  } catch (error) {
    console.error("Error booking seat:", error);
    throw error;
  }
};

export default { api, authService, adminService };

// Also export individual functions for direct imports
export { authService, adminService };
