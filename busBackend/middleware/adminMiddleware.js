const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token has role field and it's 'admin'
    if (!decoded.role || decoded.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(403).json({ message: "Forbidden: Admin not found" });
    }

    req.user = admin; // Keep as req.user for backward compatibility
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = adminMiddleware;
