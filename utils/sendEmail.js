const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"CarSpot" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });

    console.log(' Email sent successfully');
  } catch (error) {
    console.error(' Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
