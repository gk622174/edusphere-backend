const cloudinary = require("cloudinary").v2;

const cloudinaryConnect = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary Connect Successfully");
  } catch (error) {
    console.log("Failed To Connect Cloudinary", error);
    process.exit(1);
  }
};

module.exports = cloudinaryConnect;
