// src/components/ScrollableDashboard.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardView from "./DashboardView";
import CombinedBusView from "./CombinedBusView";
import BookingsView from "./BookingsView";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { authService } from "../services/api";
import "./ScrollStyles.css";

const ScrollableDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const sectionRefs = {
    dashboard: useRef(null),
    buses: useRef(null),
    bookings: useRef(null),
  };
  
  // Handle logout
  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Handle smooth scrolling when clicking on sidebar links
  const scrollToSection = (sectionId) => {
    const section = sectionRefs[sectionId]?.current;
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
  };

  // Set up intersection observer for scroll spy functionality
  useEffect(() => {
    const observerOptions = {
      root: null, // Use the viewport as the root
      rootMargin: "-100px 0px -80% 0px", // Adjust rootMargin to control when sections are considered "active"
      threshold: 0, // Trigger when any part of the element is visible
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all section refs
    Object.entries(sectionRefs).forEach(([id, ref]) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Fixed Sidebar Navigation */}
      <div className={`fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <Sidebar activeSection={activeSection} onSectionChange={scrollToSection} onLogout={handleLogout} user={authService.getCurrentUser()} />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content with left margin to account for fixed sidebar */}
      <div className="flex-1 md:ml-80 flex flex-col overflow-hidden">
        <Header 
          activeSection={activeSection} 
          user={authService.getCurrentUser()} 
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 overflow-y-auto">
        {/* Dashboard Section */}
        <section 
          id="dashboard" 
          ref={sectionRefs.dashboard}
          className={`min-h-screen py-8 px-6 ${activeSection === "dashboard" ? "active" : ""}`}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
          <DashboardView />
        </section>

        {/* Buses Section */}
        <section 
          id="buses" 
          ref={sectionRefs.buses}
          className={`min-h-screen py-8 px-6 ${activeSection === "buses" ? "active" : ""}`}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bus Schedule</h2>
          <CombinedBusView />
        </section>

        {/* Bookings Section */}
        <section 
          id="bookings" 
          ref={sectionRefs.bookings}
          className={`min-h-screen py-8 px-6 ${activeSection === "bookings" ? "active" : ""}`}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bookings</h2>
          <BookingsView />
        </section>


        </div>
      </div>
    </div>
  );
};

export default ScrollableDashboard;