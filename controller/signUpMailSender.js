const { redisClient } = require("../config/redisClient");
const mailSender = require("../utiles/mailsender");
const User = require("../models/user");
const isValidEmail = require("../utiles/emailValidator");

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

exports.sendMail = async (req, res) => {
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

    // 5. Check if OTP already exists in Redis
    let otp = await redisClient.get(`otp:${email}`);

    if (!otp) {
      //  Generate new OTP
      otp = Math.floor(100000 + Math.random() * 900000).toString();

      //  Store OTP in Redis (expires in 5 minutes)
      await redisClient.setEx(`otp:${email}`, 300, otp);

      //  Send OTP email
      const emailSent = await mailSender(
        email,
        "EduSphere - Email Verification",
        `
        <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 40px; text-align: center;">
          <div style="max-width: 500px; background: white; padding: 20px; border-radius: 12px; margin: auto; box-shadow: 0px 4px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #2e7dff; margin-bottom: 10px;">🔐 Email Verification</h2>
            <p style="font-size: 16px; color: #555;">
              Hello <strong>${firstName} ${lastName}</strong>,<br>
              We received a request to verify your email for your <strong>EduSphere</strong> account.
            </p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111;">
              ${otp}
            </div>
            <p style="color: #555; font-size: 14px;">
              This OTP will expire in <strong>5 minutes</strong>. Please do not share it with anyone for security reasons.
            </p>
      
            <p style="margin-top: 20px; font-size: 12px; color: #888;">
              If you didn't request this, please ignore this email or contact our support.
            </p>
          </div>
          <p style="font-size: 12px; color: #aaa; margin-top: 15px;">
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
    }

    // 6. Success response
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("Error sending email or generating OTP:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while sending OTP",
    });
  }
};
