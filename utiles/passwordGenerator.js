const crypto = require("crypto");

const passwordGenerator = (length = 8) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!&";
  let password = "";
  const randomBytes = crypto.randomBytes(length);

  for (i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
};

module.exports = passwordGenerator;
