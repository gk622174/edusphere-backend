/**
 * Validate email format
 * @param {string} email - Email string to validate
 * @returns {boolean} true if valid, false if invalid
 */
function isValidEmail(email) {
  try {
    // 1. Type check - string must be
    if (typeof email !== "string") return false;

    // 2. Trim spaces
    email = email.trim();

    // 3. Empty check
    if (email.length === 0) return false;

    // 4. Email regex pattern (RFC 5322 simplified)
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 5. Test and return
    return pattern.test(email);
  } catch (error) {
    // 6. error then false return
    return false;
  }
}

module.exports = isValidEmail;
