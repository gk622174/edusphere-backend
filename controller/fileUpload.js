const path = require("path");
const File = require("../models/fileUplaodModel");
const { imageFileType } = require("../utiles/imageFileType");
const { uploadCloudinary } = require("../utiles/uploadCloudinary");

exports.localFileUpload = async (req, res) => {
  try {
    // 1. Fetching file From Req Files
    const file = req.files.image;

    if (!file) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "File Not Found",
      });
    }

    // 2. Creating File Path
    const filePath =
      __dirname + "/files/" + Date.now() + path.extname(file.name);

    // 3. check Path exist Or Not
    if (!filePath) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "File Path Not Found",
      });
    }

    // 4. Move File To The Path
    await file.mv(filePath);

    // 5. Success Message
    res.status(200).json({
      success: true,
      message: "File Uploaded Successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      success: false,
      message: "File Uploaded Failed",
    });
  }
};

exports.uploadImageUrl = async (req, res) => {
  try {
    // 1. Fetching Data From Req Body
    const { name, email, imageUrl, tag } = req.body;
    // 2. Fetching File From Req Body.files
    const file = req.files?.image;

    // 3. Check All Valid Data And File Exist Or Not
    if (!name || !email || !file) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Please Enter Valid Data",
      });
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
      return res.status(400).json({ message: "File too large" });
    }
    // 4. Extract File Extension Name
    const fileType = path
      .extname(file.name)
      .replace(".", "")
      .toLocaleLowerCase();

    // Check File Supported Or Not
    if (!imageFileType(fileType)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: " File Type Is Not Supported",
      });
    }

    let cloudinaryResponse;
    try {
      cloudinaryResponse = await uploadCloudinary(file, "StudyNotion");
    } catch (err) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "File Upload On Cloudinary Failed",
      });
    }

    if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Cloudinary Secure Url Not Found",
      });
    }

    const newFile = new File({
      name,
      email,
      imageUrl: cloudinaryResponse?.secure_url,
      tag,
    });

    const dbResponse = await newFile.save();
    res.status(200).json({
      success: true,
      data: dbResponse,
      Url: cloudinaryResponse?.secure_url,
      message: "Cloudinary File Upload Data Save In DB",
    });
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Internal Server Error",
    });
  }
};
