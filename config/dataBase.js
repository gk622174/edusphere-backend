const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("DataBase Connect Successfully");
  } catch (error) {
    console.log("Failed To Connect Mongo DataBase", error);
    process.exit(1);
  }
};

module.exports = dbConnect;
