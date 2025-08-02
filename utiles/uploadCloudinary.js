const cloudinary = require("cloudinary").v2;

exports.uploadCloudinary = async (file, folder, quality) => {
  let options = { folder };
  options.resource_type = "auto";
  options.quality = quality;
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
