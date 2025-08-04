"use client"
import {
  LayoutDashboard,
  Bus,
  Calendar,
  Users,
  Settings,
  ChevronRight,
  Zap,
  TrendingUp,
  Shield,
} from "lucide-react"

const Sidebar = ({ activeSection, onSectionChange, onLogout, user }) => {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      gradient: "from-emerald-500 to-teal-500",
      description: "Overview & Analytics",
    },
    {
      id: "buses",
      label: "Bus Management",
      icon: Bus,
      gradient: "from-teal-500 to-cyan-500",
      description: "Manage Fleet",
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: Calendar,
      gradient: "from-cyan-500 to-blue-500",
      description: "Reservations",
    },
  ]

  return (
    <div className="w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl relative overflow-hidden h-full">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/20"></div>
        <div className="absolute top-1/4 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              BusAdmin Pro
            </h1>
            <p className="text-xs text-slate-400">Management Portal</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Super Admin
              </p>
            </div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 relative z-10">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 shadow-lg"
                  : "hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-r"></div>
              )}

              {/* Hover Effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
              ></div>

              <div className="relative p-4 flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                      : "bg-slate-700/50 group-hover:bg-slate-600/50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                    }`}
                  />
                </div>

                <div className="flex-1 text-left">
                  <p
                    className={`font-semibold transition-colors duration-300 ${
                      isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-xs transition-colors duration-300 ${
                      isActive ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-300"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>

                <ChevronRight
                  className={`w-4 h-4 transition-all duration-300 ${
                    isActive
                      ? "text-emerald-400 transform translate-x-1"
                      : "text-slate-500 group-hover:text-slate-300 group-hover:transform group-hover:translate-x-1"
                  }`}
                />
              </div>
            </button>
          )
        })}
      </nav>

      {/* Stats Section */}
      <div className="relative z-10 p-4 border-t border-slate-700/50">
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-emerald-400">System Status</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300">Server</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-400">Online</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-300">Database</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-400">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer space - Sign Out moved to header */}
      <div className="relative z-10 p-4 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 text-center">
          <p>BusAdmin Pro</p>
          <p>Management Portal</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
