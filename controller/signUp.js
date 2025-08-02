const { redisClient } = require("../config/redisClient");
const User = require("../models/user");
const Profile = require("../models/profile");
const hashingPassword = require("../utiles/hashingPassword");
const isValidEmail = require("../utiles/emailValidator");
const isStrongPassword = require("../utiles/passwordChecker");

/**
 * =========================================
 * SIGNUP CONTROLLER - FLOW DESCRIPTION
 * =========================================
 *
 * 1️. Receive Request Data:
 *    - Extract `firstName`, `lastName`, `email`, `password`,
 *      `confirmPassword`, `accountType`, and `otp` from `req.body`
 *
 * 2️. Required Fields Check:
 *    - If any field missing → return 400 Bad Request
 *
 * 3️. Email Format Validation:
 *    - Check using `isValidEmail`
 *    - If invalid → return 422 Unprocessable Entity
 *
 * 4️. Strong Password Validation:
 *    - Check using `isStrongPassword`
 *    - If weak → return 422 Unprocessable Entity
 *
 * 5️. Password Match Check:
 *    - If password !== confirmPassword → return 400 Bad Request
 *
 * 6️. Check Existing User:
 *    - Search in DB by email
 *    - If found → return 409 Conflict
 *
 * 7️. OTP Verification from Redis:
 *    - Get `otp:<email>` from Redis
 *    - If missing → return 410 Gone (expired or not found)
 *
 * 8️. OTP Match Check:
 *    - If provided OTP !== Redis OTP → return 401 Unauthorized
 *
 * 9️. Hash Password:
 *    - Use `hashingPassword` utility
 *    - If hashing fails → return 500 Internal Server Error
 *
 * 10. Create Default Profile:
 *    - Gender: null, DOB: null, Image: DiceBear avatar
 *
 * 1️1️. Create New User:
 *    - With hashed password, accountType, and profile reference
 *
 * 1️2️. Save User in MongoDB
 *
 * 1️3️. Delete OTP from Redis:
 *    - Prevent OTP reuse
 *
 * 1️4️. Remove Password from Response Object:
 *    - For security before sending back to client
 *
 * 1️5️. Send Success Response:
 *    - Status 201 Created with user data (without password)
 *
 * 16. Error Handling:
 *    - Any unexpected error → return 500 Internal Server Error
 */

exports.signUp = async (req, res) => {
  try {
    // 1. Fetching data from request body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      otp,
    } = req.body;

    // 2. Required fields check
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the required",
      });
    }

    // 3. Check if OTP is provided in request
    if (!otp) {
      return res.status(400).josn({
        success: false,
        message: "Please enter OTP",
      });
    }

    // 4. Email format validation
    if (!isValidEmail(email)) {
      return res.status(422).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 5. Strong password validation
    if (!isStrongPassword(password)) {
      return res.status(422).json({
        success: false,
        message:
          "Password must be at least 8 chars, include uppercase, lowercase, number & special character",
      });
    }

    // 6. Password match check
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    // 7. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists, please login",
      });
    }

    // 8. OTP verification from Redis
    const redisOtp = await redisClient.get(`otp:${email}`);
    if (!redisOtp) {
      return res.status(410).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    // 9. OTP match check
    if (otp !== redisOtp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 10. Password hashing
    const hashedPassword = await hashingPassword(password);
    if (!hashedPassword) {
      return res.status(500).json({
        success: false,
        message: "Password hashing failed",
      });
    }

    // 11. Create default profile
    const profileDetail = await Profile.create({
      gender: null,
      dateOfBirth: null,
      image: `https://api.dicebear.com/7.x/initials/svg?seed=${firstName} ${lastName}`,
      about: null,
      contactNo: null,
      profession: null,
    });

    // 12. Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetail._id,
    });

    // 13. Save user
    let response = await newUser.save();

    // 14. Remove password from response
    if (response) {
      response = response.toObject();
      response.password = undefined;
    }

    // 15. Success response
    res.status(201).json({
      success: true,
      data: response,
      message: "Signup successful",
    });
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during signup",
    });
  }
};
