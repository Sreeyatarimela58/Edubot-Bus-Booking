// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginView from './components/LoginView';
import ScrollableDashboard from './components/ScrollableDashboard';
import { authService } from './services/api';
import "./index.css";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check authentication status when app loads
    const checkAuth = () => {
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-red-600 mb-2">AbhiBus Admin</h2>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <ScrollableDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
