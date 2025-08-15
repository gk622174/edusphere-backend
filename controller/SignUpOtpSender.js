// const { redisClient } = require("../config/redisClient");
const mailSender = require("../utiles/mailSender");
const User = require("../models/user");
const isValidEmail = require("../utiles/emailValidator");
const { setCache, getCache } = require("../utiles/memoryRedis");

/**
 * =========================================
 * SEND EMAIL VERIFICATION OTP - FLOW
 * =========================================
 *
 * 1️. Receive Request Data:
 *    - Extract `firstName`, `lastName`, `email` from request body
 *    - Names are optional (used only for personalizing email)
 *
 * 2️. Email Presence Validation:
 *    - If `email` is missing → return **400 Bad Request**
 *
 * 3️. Email Format Validation:
 *    - Validate using `isValidEmail`
 *    - If invalid → return **400 Bad Request**
 *
 * 4️. Check If User Already Exists:
 *    - Search MongoDB for `email`
 *    - If found → return **409 Conflict** (User should login instead)
 *
 * 5️. Check OTP in Redis:
 *    - Look for key: `otp:<email>`
 *    - If OTP already exists → skip generating a new one
 *
 * 6️. Generate OTP (If Not Exists):
 *    - Create 6‑digit random OTP
 *
 * 7️. Store OTP in Redis:
 *    - Key format: `otp:<email>`
 *    - Expiry: **5 minutes (300 seconds)**
 *
 * 8️. Send OTP Email:
 *    - Call `mailSender()` with:
 *      - Recipient email
 *      - Subject: "EduSphere - Email Verification"
 *      - HTML email body (styled, OTP included, expiry notice)
 *
 * 9️. Send Success Response:
 *    - Status: **200 OK**
 *    - Message: "OTP sent successfully"
 *
 * 10. Error Handling:
 *    - Catch Redis, DB, or email errors
 *    - Log error for debugging
 *    - Return **500 Internal Server Error**
 */

exports.otpMail = async (req, res) => {
  try {
    // 1. Fetching data from request body
    const { firstName = "", lastName = "", email } = req.body;

    // 2. Email validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 3. Email format validation
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    // 4. Check if user already exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        success: false,
        message: "User already exists, please login",
      });
    }

    // 5. Check if OTP already exists in RedisMemory
    let otp = getCache(`otp:${email}`);
    let emailSent;
    if (!otp) {
      //  Generate new OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

      //  Send OTP email
      emailSent = await mailSender(
        email,
        "EduSphere - Email Verification",
        `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 30px; text-align: center;">
  <div style="max-width: 550px; margin: auto; background: white; border-radius: 14px; padding: 35px 25px; box-shadow: 0px 6px 18px rgba(0,0,0,0.08);">

    <!-- Logo -->
    <div style="margin-bottom: 15px;">
      <img src="https://res.cloudinary.com/dglgmkgt4/image/upload/v1754124919/eduSphere_fu67gz.png" alt="EduSphere Logo" style="width: 80px;">
    </div>

    <!-- Title -->
    <h2 style="color: #2e7dff; margin-bottom: 10px; white-space: nowrap;">
      🔐 Email Verification
    </h2>

    <!-- Message -->
    <p style="font-size: 15px; color: #555; line-height: 1.6;">
      Hello <strong>${firstName} ${lastName}</strong>,<br>
      We received a request to verify your email for your <strong>EduSphere</strong> account.
    </p>

    <!-- OTP Box -->
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #111;">
      ${newOtp}
    </div>

    <!-- Expiry Note -->
    <p style="color: #555; font-size: 14px;">
      This OTP will expire in <strong>5 minutes</strong>. Please do not share it with anyone for security reasons.
    </p>

    <!-- Footer Info -->
    <p style="margin-top: 20px; font-size: 12px; color: #888;">
      If you didn't request this, please ignore this email or contact our support.
    </p>
  </div>

  <p style="font-size: 11px; color: #aaa; margin-top: 20px;">
    © ${new Date().getFullYear()} EduSphere. All rights reserved.
  </p>
</div>
`
      );

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email. Please try again later.",
        });
      }

      //  Store OTP in RedisMemory (expires in 5 minutes)
      setCache(`otp:${email}`, newOtp, 300);
    }

    // 6. Success response
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("Error sending email or generating OTP:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while sending OTP",
    });
  }
};
