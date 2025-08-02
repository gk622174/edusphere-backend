const User = require("../models/user");
const isValidEmail = require("../utiles/emailValidator");
const isStrongPassword = require("../utiles/passwordChecker");
const hashingPassword = require("../utiles/hashingPassword");
const crypto = require("crypto");
const mailsender = require("../utiles/mailSender");

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
    await User.findOneAndUpdate(
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
      return res.status(500).json({
        success: false,
        message:
          "Unable to send password reset email. Please try again later .",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Password reset email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.log("Error while sending reset password email:", error);
    res.status(500).json({
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
        message: "Please entry strong password",
      });
    }

    // 4. Match "newPassword" And "confirmPassword"
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: " New password and confirm Password not matched",
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
        message: "User not found",
      });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Link is expire send again for password reset",
      });
    }

    // 5. Hashing "newPassword"
    const hasedPassword = await hashingPassword(newPassword);
    user.password = hasedPassword;
    user.token = null;
    user.resetPasswordExpires = null;

    // 6. Save New User
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password change successfully",
    });
  } catch (error) {
    console.log("Error when reset password", error);
    res.status(500).json({
      success: false,
      message: "Password reset Failed",
    });
  }
};
