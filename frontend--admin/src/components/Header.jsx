import { User, LogOut, Shield, Activity, Clock, Settings, Menu } from "lucide-react"
import { useState } from "react"

const Header = ({ user, activeSection, onLogout, onMenuClick }) => {

  const getSectionTitle = () => {
    switch (activeSection) {
      case "dashboard":
        return { title: "Dashboard Overview", subtitle: "Monitor your bus operations" }
      case "buses":
        return { title: "Bus Management", subtitle: "Manage your fleet and schedules" }
      case "bookings":
        return { title: "Booking Management", subtitle: "Track reservations and passengers" }
      case "profile":
        return { title: "Profile Settings", subtitle: "Manage your account preferences" }
      default:
        return { title: "Admin Portal", subtitle: "Welcome back" }
    }
  }

  const { title, subtitle } = getSectionTitle()
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  
  // Search functionality completely removed

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left Section - Title */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              {subtitle}
            </p>
          </div>
        </div>

        {/* Center Section - Search bar removed */}
        <div className="flex-1"></div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-4">
          {/* Time Display */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">{currentTime}</span>
          </div>

          {/* Notifications and Settings icons removed as requested */}

          {/* User Profile and Sign Out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800">{user?.name || "Admin"}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Super Admin
                </p>
              </div>
            </div>
            
            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 p-2 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl transition-all duration-300 border border-red-200 text-red-600 hover:text-red-700"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-emerald-700">System Online</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
            <Activity className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">All Services Active</span>
          </div>
        </div>

        <div className="text-xs text-gray-500">Last updated: {new Date().toLocaleString()}</div>
      </div>
    </header>
  )
}

export default Header
