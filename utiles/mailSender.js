const transpoter = require("../config/transpoter");

const mailSender = async (email, title, body) => {
  try {
    await transpoter.sendMail({
      from: " EduSphere - By Gaurav",
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

module.exports = mailSender;
