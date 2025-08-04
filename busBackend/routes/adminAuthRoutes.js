const express = require("express")
const adminAuthController = require("../controllers/adminAuthController")
const router = express.Router()

// Admin Login
router.post("/login", (req, res, next) => {
  console.log("Admin login attempt:", { email: req.body.email })
  adminAuthController.adminLogin(req, res, next)
})

module.exports = router
