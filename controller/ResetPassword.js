const User = require("../models/user");
const isValidEmail = require("../utiles/emailValidator");
const isStrongPassword = require("../utiles/passwordChecker");
const hashingPassword = require("../utiles/hashingPassword");
const crypto = require("crypto");
const mailsender = require("../utiles/mailSender");

/**
 * ===================== PASSWORD RESET FLOW (Production-Ready) =====================
 *
 * 1️. User requests password reset by providing their email address.
 *
 * 2️. Backend validates:
 *     - Email field is filled
 *     - Email format is valid
 *     - User exists in DB
 *
 * 3️. Backend generates a unique token:
 *     - Use `crypto.randomUUID()` (secure & random)
 *     - Save token and expiry time in DB (Example: 5 minutes validity)
 *
 * 4️. Backend creates a password reset link:
 *     - Example: `${frontendBaseUrl}/change-password/${token}`
 *
 * 5️. Backend sends an HTML email:
 *     - Includes reset link
 *     - Mentions expiry time
 *     - Styled professionally for production
 *
 * 6️. If email fails to send:
 *     - Remove token & expiry from DB (cleanup)
 *     - Log warning with email & token for debugging
 *
 * 7️. If email is sent successfully:
 *     - Send success JSON response: "Password reset email sent successfully"
 *
 * ====================================================================================
 *
 * 8️. User clicks link in email:
 *     - Frontend takes token from URL
 *     - Displays "Change Password" form
 *
 * 9️. User enters:
 *     - New password
 *     - Confirm password
 *     - Token (hidden field from URL)
 *
 * . Backend validates:
 *     - All fields filled
 *     - New password strong enough (uppercase, lowercase, number, special char)
 *     - New password matches confirm password
 *
 * 1️1️. Backend checks token in DB:
 *     - Token exists
 *     - Token expiry time > current time
 *     - If invalid/expired → clear token from DB and return error
 *
 * 1️2️. Backend hashes new password:
 *     - Use bcrypt or argon2 for hashing
 *
 * 1️3️. Backend updates:
 *     - Save hashed password in DB
 *     - Remove token & expiry from DB
 *
 * 1️4️. Backend sends success response:
 *     - "Password changed successfully, please log in again"
 *
 * ====================================================================================
 *
 *  SECURITY TIPS FOR PRODUCTION:
 *     - Always use HTTPS for reset link
 *     - Use strong token generation (`crypto.randomUUID()` or `crypto.randomBytes`)
 *     - Expire tokens quickly (5-15 mins)
 *     - Remove token from DB after successful password reset
 *     - Log important events (mail fail, token invalid) for debugging
 *     - Never log full passwords or tokens in production
 */

exports.resetPasswordToken = async (req, res) => {
  try {
    // 1. Fetching Data From Req Body
    const { email } = req.body;
    // 2. Check Email Inputs Filled Properly
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    // 3. Email Validation
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 4. Check user exist or not
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // 5. Create Token
    const token = crypto.randomUUID();

    // 6. Updtae Token And Expire In User
    const userDetail = await User.findOneAndUpdate(
      { email },
      { token: token, resetPasswordExpires: Date.now() + 5 * 60 * 1000 },
      { new: true }
    );

    // 6. Create BaseUrl
    const frontendBaseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : process.env.LOCAL_FRONTEND_URL;

    // 8. Create  Url
    const url = `${frontendBaseUrl}/change-password/${token}`;

    // 9. Send Mail
    const sentMail = await mailsender(
      email,
      "Password verification link",
      ` <div style="background-color: #f4f6f8; padding: 30px; font-family: Arial, sans-serif; text-align: center;">
    
    <div style="max-width: 550px; margin: auto; background: white; border-radius: 14px; padding: 35px 25px; box-shadow: 0px 6px 18px rgba(0,0,0,0.08);">
      
      <!-- Logo / Brand -->
      <div style="margin-bottom: 15px;">
        <img src="https://res.cloudinary.com/dglgmkgt4/image/upload/v1754124919/eduSphere_fu67gz.png" alt="Lock Icon" style="width: 60px; height: 60px;">
      </div>

      <h1 style="color: #2e7dff; margin-bottom: 10px; font-size: 22px;">Password Reset Request</h1>
      
      <p style="font-size: 15px; color: #555; line-height: 1.6;">
        You recently requested to reset your password for your <strong>EduSphere</strong> account.
        Click the button below to create a new password.
      </p>

      <!-- Button -->
      <a href="${url}" 
        style="display: inline-block; background: linear-gradient(135deg, #2e7dff, #1b5dd8); 
        color: white; padding: 14px 28px; margin-top: 20px; border-radius: 8px; 
        text-decoration: none; font-weight: bold; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0px 4px 10px rgba(46,125,255,0.3);">
        🔐 Change My Password
      </a>

      <p style="color: #999; font-size: 13px; margin-top: 25px;">
        ⏳ This link will expire in <strong>5 minutes</strong> for security reasons.
      </p>

      <!-- Divider -->
      <hr style="margin: 25px 0; border: none; height: 1px; background: #eee;">

      <p style="color: #777; font-size: 12px; line-height: 1.5;">
        If you did not request this password reset, you can safely ignore this email. 
        Your password will remain unchanged.
      </p>

    </div>

    <!-- Footer -->
    <p style="font-size: 11px; color: #aaa; margin-top: 20px;">
      © ${new Date().getFullYear()} EduSphere. All rights reserved.
    </p>

   </div>`
    );

    if (!sentMail) {
      await User.findOneAndUpdate(
        { email },
        { token: null, resetPasswordExpires: null }
      );
      console.warn(`Password reset mail failed for user: ${email}`);
      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset email. Please try again later .",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password reset email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.log("Error while sending reset password email:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request.",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // 1. Fetch Data From Req Body
    const { newPassword, confirmPassword, token } = req.body;
    // 2. Check All The Field Must Be Filled
    if (!newPassword || !confirmPassword || !token) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the required field",
      });
    }

    // 3. Strong Password Check
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      });
    }

    // 4. Match "newPassword" And "confirmPassword"
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // 5. Finding "User" Using Token
    let user = await User.findOne({
      token: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    // 6. Hashing "newPassword"
    const hashedPassword = await hashingPassword(newPassword);
    user.password = hashedPassword;
    user.token = null;
    user.resetPasswordExpires = null;

    // 7. Save New User
    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Your password has been changed successfully. Please login again.",
    });
  } catch (error) {
    console.log("Error when reset password", error);
    return res.status(500).json({
      success: false,
      message: "Password reset Failed",
    });
  }
};
