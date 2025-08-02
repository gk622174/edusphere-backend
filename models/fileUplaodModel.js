const mongoose = require("mongoose");
const transpoter = require("../config/transpoter");

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  tag: {
    type: String,
  },
});

// post middleware
fileSchema.post("save", async (doc) => {
  try {
    // Send Mail
    let info = await transpoter.sendMail({
      from: "StudyNotion - by gaurav",
      to: doc.email,
      subject: "New File Uploaded On Cloudinary",
      html: `<h2>Hello</h2> <p>File Uploaded View here: <a href="${doc.imageUrl}">${doc.imageUrl}</a></p>`,
    });
    console.log("info:", info);
  } catch (err) {
    console.log(err);
  }
});
module.exports = mongoose.model("File", fileSchema);
