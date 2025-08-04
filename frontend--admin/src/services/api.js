// src/services/api.js
import axios from "axios"

const API_URL = "https://edubot-bus-booking.onrender.com/api"

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
})

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
      localStorage.removeItem("adminUser")
      // Don't redirect here to avoid infinite loops
    }
    return Promise.reject(error)
  },
)

// Auth services
const authService = {
  login: async (credentials) => {
    try {
      console.log("Sending login request to:", `${API_URL}/admin/auth/login`)
      console.log("With credentials:", { email: credentials.email, password: "***" })

      // Use the correct endpoint for admin login
      const response = await api.post("/admin/auth/login", credentials)
      console.log("Login response received:", response.data)

      if (response.data && response.data.token) {
        localStorage.setItem("adminToken", response.data.token)
        localStorage.setItem("adminUser", JSON.stringify(response.data.user))
        return response.data
      } else {
        throw new Error("Invalid response format from server")
      }
    } catch (error) {
      console.error("Login error details:", error.response || error)
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
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem("adminUser")
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
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
      const response = await api.get("/buses")
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
      return response.data.bookings
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
      return response.data
    } catch (error) {
      console.error("Error fetching buses for date range:", error)
      throw error
    }
  },
  getMonthlyBookings: async (year, month) => {
    try {
      const response = await api.get(`/admin/monthly-bookings?year=${year}&month=${month}`)
      return response.data.bookings
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

export { authService, adminService }
