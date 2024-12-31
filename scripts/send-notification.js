const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

async function sendEmail({ subject, body, to }) {
  const client = new SESClient({ region: "us-east-1" });

  // Ensure the Source email has a domain
  const sourceEmail = process.env.AWS_SMTP_USERNAME.includes('@') 
    ? process.env.AWS_SMTP_USERNAME 
    : `${process.env.AWS_SMTP_USERNAME}@lagomo.xyz`;

  const params = {
    Source: sourceEmail,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Text: {
          Data: body,
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await client.send(command);
    console.log("Email sent successfully:", response.MessageId);
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
