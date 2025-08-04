const express = require("express");
const router = express.Router();

const { signUp, googleSignup } = require("../controller/signUp");
const { logIn } = require("../controller/logIn");
const { localFileUpload, uploadImageUrl } = require("../controller/fileUpload");
const { otpMail } = require("../controller/signUpMailSender");
const {
  authorization,
  isStudent,
  isAdmin,
} = require("../middleware/authorization");

router.post("/signup", signUp);
router.post("/login", logIn);
router.post("/localfileupload", localFileUpload);
router.post("/imageupload", uploadImageUrl);
router.post("/otp", otpMail);
router.post("/google-signup-login", googleSignup);

// 1. Private Screat Route For Student
router.get("/student", authorization, isStudent, (req, res) => {
  const user = req.user;
  return res.status(200).json({
    success: true,
    data: user,
    message: "Welcome To Student Route",
  });
});

router.get("/admin", authorization, isAdmin, (req, res) => {
  const user = req.user;
  return res.status(200).json({
    success: true,
    data: user,
    message: "Welcome To Admin Route",
  });
});

module.exports = router;
