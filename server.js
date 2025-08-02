const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const router = require("./routes/route");
const dbConnect = require("./config/dataBase");
const cloudinaryConnect = require("./config/cloudinary");
const { connectRedis } = require("./config/redisClint");

const app = express();
// 1. LOADING CONFIG FROM ENV FILE
dotenv.config();
PORT = process.env.PORT || 8000;

// 2. MIDDLEWARE PARSING
app.use(express.json());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/temp/",
  })
);

// 3. ROUTE MOUNTING
app.use("/api/v1", router);

// 4. CREATE HOME ROUTE
app.get("/", (req, res) => {
  res.send(`<h1>Welcome To Home Route</h1>`);
});

const startServer = async () => {
  try {
    // 1a. Connect Cloudinary
    cloudinaryConnect();
    // 2a. Connect Redis
    await connectRedis();
    // 3a. Connect DataBase
    await dbConnect();
    // 4a. Listen Server
    app.listen(PORT, () => {
      console.log(`Server Is Running At http://localhost:${PORT}`);
    });
  } catch (err) {
    console.log("Failed To Connect Server");
    process.exit(1);
  }
};

startServer();
