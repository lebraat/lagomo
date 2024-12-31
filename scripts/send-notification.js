const nodemailer = require('nodemailer');

async function sendEmail({ subject, body, to }) {
  // Create SMTP transporter
  const transporter = nodemailer.createTransport({
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.AWS_SMTP_USERNAME,
      pass: process.env.AWS_SMTP_PASSWORD
    }
  });

  // Ensure the Source email has a domain
  const sourceEmail = process.env.AWS_SMTP_USERNAME.includes('@') 
    ? process.env.AWS_SMTP_USERNAME 
    : `${process.env.AWS_SMTP_USERNAME}@lagomo.xyz`;

  try {
    const info = await transporter.sendMail({
      from: sourceEmail,
      to: to,
      subject: subject,
      text: body,
    });
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    process.exit(1);
  }
}

// Get parameters from command line arguments
const args = process.argv.slice(2);
if (args.length !== 3) {
  console.error("Usage: node send-notification.js <subject> <body> <to>");
  process.exit(1);
}

sendEmail({
  subject: args[0],
  body: args[1],
  to: args[2],
});
