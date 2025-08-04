console.log("✅ authController loaded")
const nodemailer = require("nodemailer")
const Otp = require("../models/Otp")
const User = require("../models/userModel")
const jwt = require("jsonwebtoken")

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

const requestOtp = async (req, res) => {
  const { email } = req.body
  console.log("📩 requestOtp hit, email:", email)

  if (!email) {
    console.log("❌ Email is required but was not provided")
    return res.status(400).json({ success: false, message: "Email is required" })
  }

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase()
  console.log("📧 Normalized email:", normalizedEmail)

  try {
    // Check if user already exists
    console.log("🔍 Checking if user already exists with email:", normalizedEmail)
    const userExists = await User.findOne({ email: normalizedEmail })
    if (userExists) {
      console.log("❌ Email already registered:", normalizedEmail)
      console.log("📋 Existing user details:", {
        id: userExists._id,
        name: userExists.name,
        email: userExists.email,
        createdAt: userExists.createdAt
      })
      return res.status(400).json({ success: false, message: "Email already registered" })
    }
    console.log("✅ Email is available for registration")

    // Generate a new OTP
    const otp = generateOTP()
    console.log("🔢 Generated OTP for email:", normalizedEmail, "OTP:", otp)

    // Delete any existing OTPs for this email
    console.log("🧹 Deleting existing OTPs for email:", normalizedEmail)
    const deleteResult = await Otp.deleteMany({ email: normalizedEmail })
    console.log("✅ Deleted existing OTPs:", deleteResult.deletedCount, "records")

    // Save new OTP in DB
    console.log("💾 Saving new OTP in database")
    const expiryTime = Date.now() + 5 * 60 * 1000 // 5 mins
    const otpRecord = await Otp.create({
      email: normalizedEmail,
      otp,
      expiresAt: expiryTime,
      used: false
    })
    console.log("✅ Saved new OTP in database with ID:", otpRecord._id)
    console.log("📋 OTP details:", {
      id: otpRecord._id,
      email: otpRecord.email,
      otp: otpRecord.otp,
      expiresAt: new Date(otpRecord.expiresAt),
      used: otpRecord.used
    })

    // Send OTP email
    console.log("📧 Sending OTP email to:", normalizedEmail)
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Your OTP for Registration",
      html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This OTP will expire in 5 minutes.</p>`,
    })
    console.log("✅ Sent OTP email to:", normalizedEmail)

    console.log("✅ OTP request process completed successfully")
    res.json({ success: true, message: "OTP sent successfully" })
  } catch (error) {
    console.error("❌ Error in requestOtp:", error)
    res.status(500).json({ success: false, message: "Failed to send OTP" })
  }
}

const verifyOtpAndRegister = async (req, res) => {
  try {
    let { email, otp, name, password, phone } = req.body
    email = email.trim().toLowerCase()
    console.log("📩 Received for verification:", { 
      email, 
      otp, 
      name, 
      phone, 
      passwordLength: password ? password.length : 0 
    })

    if (!email || !otp || !name || !password || !phone) {
      console.log("❌ Missing required fields")
      return res.status(400).json({ success: false, message: "Missing required fields" })
    }

    // Check if user already exists
    console.log("🔍 Checking if user already exists with email:", email)
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log("❌ User already exists with email:", email)
      console.log("📋 Existing user details:", {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        createdAt: existingUser.createdAt
      })
      return res.status(400).json({ success: false, message: "User already exists" })
    }
    console.log("✅ Email is available for registration")

    const allOtps = await Otp.find({ email })
    console.log("📄 All OTPs for this email:", allOtps)

    const latestOtp = allOtps.sort((a, b) => b.expiresAt - a.expiresAt)[0]
    console.log("✅ Latest OTP for verification:", latestOtp)
    console.log("Comparing:", { entered: otp.toString(), stored: latestOtp ? latestOtp.otp : null })

    if (!latestOtp) {
      console.log("❌ No OTP found for email:", email)
      return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." })
    }

    if (latestOtp.otp !== otp.toString()) {
      console.log("❌ Invalid OTP provided")
      return res.status(400).json({ success: false, message: "Invalid OTP" })
    }

    if (latestOtp.expiresAt < Date.now()) {
      console.log("❌ OTP has expired. Expiry:", new Date(latestOtp.expiresAt), "Current:", new Date())
      return res.status(400).json({ success: false, message: "OTP has expired" })
    }

    // Create new user
    console.log("👤 Creating new user with data:", {
      name,
      email,
      phone,
      passwordLength: password ? password.length : 0
    })
    const user = await User.create({
      name,
      email,
      password, // This will be hashed by the pre-save hook in userModel.js
      phone,
    })
    console.log("✅ User created successfully with ID:", user._id)
    console.log("📋 New user details:", {
      id: user._id,
      name: user.name,
      email: user.email,
      passwordHash: user.password ? user.password.substring(0, 10) + '...' : 'undefined'
    })

    // Generate JWT token
    console.log("🔑 Generating JWT token with secret:", process.env.JWT_SECRET ? "[SECRET EXISTS]" : "[SECRET MISSING]")
    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: "7d" })
    console.log("✅ JWT token generated successfully:", token.substring(0, 20) + '...')

    // Clean up used OTPs
    console.log("🧹 Cleaning up all OTPs for email:", email)
    await Otp.deleteMany({ email })
    console.log("✅ Cleaned up OTPs for email:", email)

    // Return success with token and user data
    const responseData = {
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: false, // Always false for regular users
      },
    }
    console.log("✅ Sending successful registration response")
    res.status(201).json(responseData)
  } catch (error) {
    console.error("❌ Error in verifyOtpAndRegister:", error)
    res.status(500).json({ success: false, message: error.message || "Registration failed" })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    console.log("🔐 Login attempt for:", email)
    console.log("🔑 Password provided (length):", password ? password.length : 0)
    
    if (!email || !password) {
      console.log("❌ Missing email or password")
      return res.status(400).json({ success: false, message: "Email and password are required" })
    }

    console.log("🔍 Looking for user with email:", email.trim().toLowerCase())
    const user = await User.findOne({ email: email.trim().toLowerCase() })
    if (!user) {
      console.log("❌ User not found with email:", email)
      return res.status(401).json({ success: false, message: "Invalid email or password" })
    }
    
    console.log("✅ User found:", user._id)
    console.log("📋 User details:", {
      id: user._id,
      name: user.name,
      email: user.email,
      passwordHash: user.password ? user.password.substring(0, 10) + '...' : 'undefined'
    })
    
    console.log("🔐 Comparing passwords...")
    const isMatch = await user.matchPassword(password)
    console.log("🔐 Password match result:", isMatch)
    
    if (!isMatch) {
      console.log("❌ Password does not match")
      return res.status(401).json({ success: false, message: "Invalid email or password" })
    }

    console.log("🔑 Generating JWT token with secret:", process.env.JWT_SECRET ? "[SECRET EXISTS]" : "[SECRET MISSING]")
    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: "7d" })
    console.log("✅ JWT token generated successfully:", token.substring(0, 20) + '...')
    
    const responseData = {
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: false, // Always false for regular users
      },
    }
    console.log("✅ Sending successful login response")
    res.json(responseData)
  } catch (error) {
    console.error("❌ Error in login:", error)
    res.status(500).json({ success: false, message: "Login failed" })
  }
}

module.exports = {
  requestOtp,
  verifyOtpAndRegister,
  login,
}
