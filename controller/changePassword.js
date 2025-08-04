const User = require("../models/user");
const bcrypt = require("bcrypt");
const hashingPassword = require("../utiles/hashingPassword");
const jwt = require("jsonwebtoken");
const isStrongPassword = require("../utiles/passwordChecker");

/**
 * =========================================
 * CHANGE PASSWORD CONTROLLER - FLOW
 * =========================================
 *
 * 1️. Receive Request Data:
 *    - Extract `oldPassword`, `newPassword`, `confirmNewPassword` from request body.
 *
 * 2️. Required Fields Validation:
 *    - If any field is missing → return **400 Bad Request**.
 *
 * 3️. Strong Password Check:
 *    - Validate `newPassword` using `isStrongPassword()`.
 *    - If weak → return **400 Bad Request** with password policy message.
 *
 * 4️. Match New & Confirm Password:
 *    - If they do not match → return **400 Bad Request**.
 *
 * 5️. Identify User:
 *    - Get `userId` from `req.user` (set by authentication middleware).
 *    - Fetch user from DB.
 *    - If not found → return **404 Not Found**.
 *
 * 6️. Verify Old Password:
 *    - Compare `oldPassword` with stored hashed password using bcrypt.
 *    - If mismatch → return **401 Unauthorized**.
 *
 * 7️. Hash New Password:
 *    - Use `hashingPassword()` to hash `newPassword`.
 *
 * 8️. Update Password in DB:
 *    - Assign hashed password to `user.password`.
 *    - Save user record to DB.
 *
 *  Error Handling:
 *    - Catch unexpected errors, log them, return **500 Internal Server Error**.
 */

exports.changePassword = async (req, res) => {
  try {
    // 1. Fetching Data From Req Body
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    // 2. Check All The Inputs
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Please fill all required fields",
      });
    }

    // 3. NewPassword must be strong
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 chars, include uppercase, lowercase, number & special character",
      });
    }

    // 4. Comparing newPassword and confirmPassword
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "New password and confirm password do not match",
      });
    }

    // 5. Fetching "userId" From "req.user" Because We Insert Token Paload In "req.user" In Authorization As "decode"
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Not Valid User Or User Not Found",
      });
    }

    // 6. Compare OldPassword Insert By User And Password Which Is In DataBase
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Old password is incorrect",
      });
    }

    // 7. Hashing New Password
    const hashedPassword = await hashingPassword(newPassword);
    // 8. Insert HashedPassword In "User-Password"
    user.password = hashedPassword;
    // 9. Save change password in user and save
    await user.save();

    return res.status(200).json({
      success: false,
      message: "Password change successfully",
    });
  } catch (err) {
    console.error("Error changing password:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
