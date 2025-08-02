const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// Create Transpoter
const transpoter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

module.exports = transpoter;
