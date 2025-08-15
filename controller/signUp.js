// const { redisClient } = require("../config/redisClient");
const User = require("../models/user");
const Profile = require("../models/profile");
const hashingPassword = require("../utiles/hashingPassword");
const isValidEmail = require("../utiles/emailValidator");
const isStrongPassword = require("../utiles/passwordChecker");
const passwordGenerator = require("../utiles/passwordGenerator");
const mailSender = require("../utiles/mailSender");
const { googleLogIn } = require("./logIn");
const { response } = require("express");
const user = require("../models/user");
const { getCache } = require("../utiles/memoryRedis");

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
    const cacheOtp = getCache(`otp:${email}`);
    if (!cacheOtp) {
      return res.status(410).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    // 9. OTP match check
    if (otp !== cacheOtp) {
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
    let createUser = await newUser.save();

    const sentEmail = await mailSender(
      email,
      "EduSphere - Your Account Has Been Created Successfully",
      `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px; text-align: center;">
  <div style="max-width: 550px; margin: auto; background: white; border-radius: 14px; padding: 35px 25px; box-shadow: 0px 6px 18px rgba(0,0,0,0.08);">
    
    <div style="margin-bottom: 15px;">
      <img src="https://res.cloudinary.com/dglgmkgt4/image/upload/v1754124919/eduSphere_fu67gz.png" alt="EduSphere Logo" style="width: 80px;">
    </div>

    <h2 style="color: #2e7dff; margin-bottom: 10px;">Welcome to EduSphere 🎓</h2>

    <p style="font-size: 15px; color: #555; line-height: 1.6;">
      Hi <strong>${firstName} ${lastName}</strong>,<br>
      Your EduSphere account has been created successfully.
    </p>

    <a href="${process.env.FRONTEND_URL}/login" 
      style="display: inline-block; background: linear-gradient(135deg, #2e7dff, #1b5dd8); 
      color: white; padding: 12px 28px; margin-top: 20px; border-radius: 8px; 
      text-decoration: none; font-weight: bold; font-size: 15px;">
      Login to EduSphere
    </a>

    <p style="font-size: 12px; color: #888; margin-top: 20px;">
      If you did not sign up for EduSphere, please ignore this email.
    </p>
  </div>

  <p style="font-size: 11px; color: #aaa; margin-top: 20px;">
    © ${new Date().getFullYear()} EduSphere. All rights reserved.
  </p>
</div>
`
    );

    if (!sentEmail) {
      await User.findByIdAndDelete(createUser._id);
      return res.status(500).json({
        success: false,
        message:
          " signup failed: Could not send verification email. Your account has been removed. Please try signing up again. ",
      });
    }
    // 14. Remove password from response
    let response;
    if (createUser) {
      response = await User.findById(createUser._id).populate();
      response.password = undefined;
    }

    // 15. Success response
    return res.status(201).json({
      success: true,
      data: response,
      message: "Signup successful",
    });
  } catch (err) {
    console.error("Signup Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during signup",
    });
  }
};

// This is for Google signUp
exports.googleSignup = async (req, res) => {
  try {
    //  1. Fetching Data From Req Body
    const { firstName, lastName, email, accountType } = req.body;

    // 2. Required fields check
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the required",
      });
    }

    // 7. Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return googleLogIn(email, res);
    }

    const password = passwordGenerator();
    if (!password) {
      return res.status(500).json({
        success: false,
        message: "Google signup failed to generate password",
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

    const sentEmail = await mailSender(
      email,
      "EduSphere - Your Account Has Been Created Successfully",
      `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px; text-align: center;">
    <div style="max-width: 550px; margin: auto; background: white; border-radius: 14px; padding: 35px 25px; box-shadow: 0px 6px 18px rgba(0,0,0,0.08);">
      
      <div style="margin-bottom: 15px;">
        <img src="https://res.cloudinary.com/dglgmkgt4/image/upload/v1754124919/eduSphere_fu67gz.png" alt="EduSphere Logo" style="width: 80px;">
      </div>

      <h1 style="color: #2e7dff; margin-bottom: 10px;">Welcome to EduSphere 🎓</h1>

      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        Hi <strong>${firstName} ${lastName}</strong>,<br>
        Your EduSphere account has been created successfully via Google Sign‑Up.
      </p>

      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #111;">
        Temporary Password: <span style="color: #2e7dff;">${password}</span>
      </div>

      <p style="color: #555; font-size: 14px;">
        Please use this password to login and change it immediately for security purposes.
      </p>

      <a href="${process.env.FRONTEND_URL}/login" 
        style="display: inline-block; background: linear-gradient(135deg, #2e7dff, #1b5dd8); 
        color: white; padding: 12px 28px; margin-top: 20px; border-radius: 8px; 
        text-decoration: none; font-weight: bold; font-size: 15px;">
        Login to EduSphere
      </a>

      <p style="font-size: 12px; color: #888; margin-top: 20px;">
        If you did not sign up for EduSphere, please ignore this email.
      </p>
    </div>

    <p style="font-size: 11px; color: #aaa; margin-top: 20px;">
      © ${new Date().getFullYear()} EduSphere. All rights reserved.
    </p>
  </div>
  `
    );

    if (!sentEmail) {
      await User.findByIdAndDelete(response._id);
      return res.status(500).json({
        success: false,
        message:
          " Google signup failed: Could not send verification email. Your account has been removed. Please try signing up again. ",
      });
    }

    googleLogIn(email, res);
  } catch (error) {
    console.log("Error when google signup", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during signup",
    });
  }
};
