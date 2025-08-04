const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');

// Middleware to protect private routes (verifies JWT)
const protect = async (req, res, next) => {
  console.log('Auth headers:', req.headers.authorization);
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    console.log('Verifying token:', token);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    // Check if it's an admin or user token based on role
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      
      if (!admin) {
        console.log('Admin not found for token ID:', decoded.id);
        return res.status(401).json({ success: false, message: 'Admin not found' });
      }
      
      console.log('Admin authenticated:', admin._id);
      req.user = admin;
      req.user.isAdmin = true; // For backward compatibility
      next();
    } else {
      // Default to user role
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.log('User not found for token ID:', decoded.id);
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      console.log('User authenticated:', user._id);
      req.user = user;
      req.user.isAdmin = false; // For backward compatibility
      next();
    }
  } catch (err) {
    console.error('JWT verification failed:', err);
    console.error('Error details:', err.message);
    res.status(401).json({ success: false, message: 'Invalid token', error: err.message });
  }
};

// Middleware to allow only admin users
const admin = (req, res, next) => {
  // Check if user has admin role or isAdmin flag (for backward compatibility)
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized as admin' });
};

module.exports = {
  protect,
  admin
};
