import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'default', fullScreen = false }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center">
          <Loader2 
            className={`animate-spin ${sizeClasses[size] || sizeClasses.default} text-red-600 mb-3`} 
          />
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 
        className={`animate-spin ${sizeClasses[size] || sizeClasses.default} text-red-600`} 
      />
    </div>
  );
};

export default LoadingSpinner;