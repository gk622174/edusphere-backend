const { redisClient } = require("../config/redisClient");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const isValidEmail = require("../utiles/emailValidator");

/**
 * =========================================
 * LOGIN CONTROLLER - FLOW DESCRIPTION
 * =========================================
 *
 *
 * 1️. Receive Request Data:
 *    - Extract `email` and `password` from req.body
 *
 * 2️. Validate Inputs:
 *    - Check if both email and password are provided
 *    - If missing → return 400 Bad Request
 *    - Validate email format using `isValidEmail`
 *
 * 3️. Check Redis Cache:
 *    - Try fetching user data from Redis using key `user:<email>`
 *    - If found → use cached data (Redis Hit - Mongoose Miss)
 *    - If not found → go to DB (Redis Miss - Mongoose Hit)
 *
 * 4️. Fetch from MongoDB (if needed):
 *    - Find user by email
 *    - If found → store user data in Redis for future with expire 10min
 *    - If not found → return 404 User Not Found
 *
 * 5️. Verify Password:
 *    - Compare plain password with hashed password using bcrypt
 *    - If mismatch → return 401 Unauthorized
 *
 * 6️. Generate JWT Token:
 *    - Payload: { id, email, accountType }
 *    - Sign with JWT_SECRET and expiry from .env
 *
 * 7️. Remove Sensitive Data:
 *    - Remove password before sending user object
 *
 * 8️. Set Secure Cookie:
 *    - httpOnly: true (JS can't read cookies)
 *    - secure: true in production (HTTPS only)
 *    - sameSite: strict (CSRF protection)
 *    - Expiry: 3 days
 *
 * 9️. Send Success Response:
 *    - Status 200 OK with user data & JWT token in cookie
 *
 * 10.Error Handling:
 *    - Log internal error
 *    - Return 500 Internal Server Error for unexpected cases
 */
exports.logIn = async (req, res) => {
  try {
    // 1 . Fetching Data from Req Body
    const { email, password } = req.body;

    // 2. Check all Inputs Are Filled
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Please Fill All The Inputs",
      });
    }

    // 3. Email format validation
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    let user;
    // 4. Check If User Data Is Cached In Redis
    const redisUser = await redisClient.get(`user:${email}`);
    if (redisUser) {
      user = JSON.parse(redisUser);
      console.log("Redis Hit - Mongoose Miss");
    } else {
      user = await User.findOne({ email }).populate("additionalDetails");
      console.log("Mongoose Hit - Redis Miss");
      if (user) {
        user = user.toObject();
        await redisClient.setEx(`user:${email}`, 600, JSON.stringify(user));
      }
    }

    // 5. If user doesn't exist
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "User Not Found, Please Signup",
      });
    }

    // 6. Compare password with hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Wrong Password",
      });
    }

    // 7. Create JWT payload
    const payload = {
      id: user._id,
      email: user.email,
      accountType: user.accountType,
    };

    // 8. Sign token with payload and secret
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    // 9. Inserting token in user
    user.token = token;
    // 10. Undefine password for security
    user.password = undefined;

    // 11. Create option for cookie
    const option = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };

    return res.cookie("token", token, option).status(200).json({
      success: true,
      data: user,
      message: "Login Successful",
      token: token,
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Something went wrong, please try again later.",
    });
  }
};

// google login
exports.googleLogIn = async (email, res) => {
  try {
    // 1. check Email,Password Existed
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email are required",
      });
    }

    const user = await User.findOne({ email }).populate("additionalDetails");

    // 4. Create JWT payload
    const payload = {
      id: user._id,
      email: user.email,
      accountType: user.accountType,
    };

    // 5. Sign token with payload and secret
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    // 6. Inserting token in user
    user.token = token;
    // 7. Undefine password for security
    user.password = undefined;

    // 8. Create option for cookie
    const option = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    };

    return res.cookie("token", token, option).status(200).json({
      success: true,
      data: user,
      message: "Google login Successful",
      token: token,
    });
  } catch (err) {
    console.error("Google login Error:", err);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Something went wrong, please try again later.",
    });
  }
};
