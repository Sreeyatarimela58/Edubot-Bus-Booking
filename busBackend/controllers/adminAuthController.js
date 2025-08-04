console.log("✅ adminAuthController loaded")
const Admin = require("../models/adminModel")
const jwt = require("jsonwebtoken")

const adminLogin = async (req, res) => {
  try {
    console.log("Admin login request received:", { email: req.body.email })
    const { email, password } = req.body

    if (!email || !password) {
      console.log("Admin login failed: Missing email or password")
      return res.status(400).json({ success: false, message: "Email and password are required" })
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() })
    if (!admin) {
      console.log("Admin login failed: Admin not found with email:", email)
      return res.status(401).json({ success: false, message: "Invalid admin credentials" })
    }

    const isMatch = await admin.matchPassword(password)
    if (!isMatch) {
      console.log("Admin login failed: Password doesn't match for:", email)
      return res.status(401).json({ success: false, message: "Invalid admin credentials" })
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables")
      return res.status(500).json({ success: false, message: "Server configuration error" })
    }

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" })
    console.log("Admin login successful for:", email)

    res.json({
      success: true,
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        isAdmin: true, // Keep this for backward compatibility
        role: admin.role,
      },
    })
  } catch (error) {
    console.error("Error in admin login:", error)
    res.status(500).json({ success: false, message: "Admin login failed" })
  }
}

// Create initial admin if none exists
const createInitialAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments()
    if (adminCount === 0) {
      console.log("Creating initial admin account...")
      await Admin.create({
        name: "Admin",
        email: "admin@example.com",
        phone: "1234567890",
        password: "admin123", // This will be hashed by the pre-save hook
        role: "admin",
      })
      console.log("Initial admin account created successfully")
    } else {
      console.log(`Found ${adminCount} existing admin accounts, skipping creation`)
    }
  } catch (error) {
    console.error("Error creating initial admin:", error)
  }
}

module.exports = {
  adminLogin,
  createInitialAdmin,
}
