// utils/passwordChecker.js

/**
 * Validate strong password
 * Password must contain:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param {string} password
 * @returns {boolean}
 */
function isStrongPassword(password) {
  const pattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
  return pattern.test(password);
}

module.exports = isStrongPassword;
