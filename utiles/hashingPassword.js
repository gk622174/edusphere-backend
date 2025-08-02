const bcrypt = require("bcrypt");

/**
 * Hash a password securely using bcrypt with retry mechanism.
 *
 * @param {string} password - The plain text password to hash
 * @param {number} retries - Number of retry attempts in case hashing fails (default: 3)
 * @returns {Promise<string>} - The hashed password
 * @throws {Error} - If all hashing attempts fail
 */
const hashingPassword = async (password, retries = 3) => {
  let attempt = 0;

  while (attempt < retries) {
    try {
      // Hash password with bcrypt using 10 salt rounds
      const hashPassword = await bcrypt.hash(password, 10);
      return hashPassword;
    } catch (err) {
      // Increase attempt count if hashing fails
      attempt++;
      console.log(`Hash Password Attempt No ${attempt} Failed`, err);
    }
  }

  // If all attempts fail, throw error
  throw new Error("Maximum attempts for hashing password failed");
};

module.exports = hashingPassword;
