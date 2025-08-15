const cloudinary = require("cloudinary").v2;

exports.uploadCloudinary = async (file, folder, height, quality) => {
  const options = { folder };
  if (height) {
    options.height = height;
  }
  if (quality) {
    options.quality = quality;
  }
  options.resource_type = "auto";
  try {
    const response = await cloudinary.uploader.upload(
      file.tempFilePath,
      options
    );
    return response;
  } catch (err) {
    console.log("Cloudinary Upload Failed", err);
  }
};
