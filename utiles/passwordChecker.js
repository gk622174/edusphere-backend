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
  // 1. Type check - string must be
  if (typeof password !== "string") return false;

  // 2. Trim space
  password = password.trim();

  // 3. Empty check
  if (password.length === 0) return false;

  // 4. Password regex pattern (RFC 5322 simplified)
  const pattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
  return pattern.test(password);
}

module.exports = isStrongPassword;
