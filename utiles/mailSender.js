const transpoter = require("../config/transpoter");

const mailSender = async (email, title, body) => {
  try {
    const info = await transpoter.sendMail({
      from: '"EduSphere - By Gaurav" <no-reply@edusphere.com>',
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });
    console.log("📧 Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports = mailSender;
