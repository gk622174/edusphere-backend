const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  gender: {
    type: String,
  },
  dateOfBirth: {
    type: String,
  },
  image: {
    type: String,
  },
  about: {
    type: String,
    trim: true,
  },
  contactNo: {
    type: String,
    trim: true,
  },
  profession: {
    type: String,
  },
});

module.exports = mongoose.model("Profile", profileSchema);
