const jwt = require("jsonwebtoken");

exports.authorization = async (req, res, next) => {
  try {
    // 1. Fetching Token
    const token =
      req.body?.token ||
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "");
    // 2. Check Token
    if (!token) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Token Missing",
      });
    }

    try {
      //  You need to pass the token and secret both here
      const decode = jwt.verify(token, process.env.JWT_SECRET); //  Verifies the token
      req.user = decode;
      // 4. Proceed to next middleware/route
      next();
    } catch (err) {
      console.log(err);
      console.error(err);
      return res.status(400).json({
        success: false,
        message: "Token Verificattion Failed",
      });
    }
  } catch (err) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Unauthorized - Invalid Token",
    });
  }
};

exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(400).json({
        success: false,
        message: "Access Denied : Students Only",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(400).json({
        success: false,
        message: "Access Denied : Admin Only",
      });
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
