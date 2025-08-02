const supportedFileType = ["png", "jpg", "jpeg"];

exports.imageFileType = (fileType) => {
  return supportedFileType.includes(fileType);
};
