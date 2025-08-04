// src/components/ProfileView.jsx
import { useState, useEffect } from "react";
import { User, Mail, Shield, Edit, Save, X, Calendar } from "lucide-react";
import { authService } from "../services/api";

const ProfileView = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get admin user from local storage
    const storedUser = localStorage.getItem("adminUser");
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing admin user from localStorage", err);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="bg-white shadow-md p-6 rounded-lg max-w-lg mx-auto text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Profile</h2>
        <p className="text-gray-600">No admin user information found. Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 p-3 rounded-full">
              <User className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{adminUser.name}</h2>
              <p className="text-gray-600">Administrator</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start space-x-4">
            <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
              <p className="text-gray-800">{adminUser.email}</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <Shield className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <p className="text-gray-800">Administrator</p>
            </div>
          </div>

          {adminUser.createdAt && (
            <div className="flex items-start space-x-4">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
                <p className="text-gray-800">{new Date(adminUser.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p>This account has administrator privileges for the bus booking system.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
