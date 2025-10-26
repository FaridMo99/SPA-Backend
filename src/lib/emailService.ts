import Mailjet from "node-mailjet" 

type UrlType = "verify-success" | "change-password";

const publicKey = process.env.MJ_APIKEY_PUBLIC;
const privateKey = process.env.MJ_APIKEY_PRIVATE;

const mailjet = new Mailjet.Client({
  apiKey: publicKey,
  apiSecret: privateKey,
});

export async function sendVerificationEmail(
  receiver: string,
  url: UrlType,
  token: string,
  userId: string,
) {
  const clientOrigin = process.env.CLIENT_ORIGIN;
  const senderEmail = process.env.EMAIL_ADDRESS!;
  const senderName = `The ${clientOrigin} Team`;

  const verificationLink = `${clientOrigin}/${url}?token=${token}&userId=${userId}`;

  const subject =
    url === "verify-success"
      ? `E-Mail verification - ${clientOrigin}`
      : `Change Password - ${clientOrigin}`;

  const htmlPart = `
    <h2>Hi there 👋</h2>
    <p>You recently visited ${clientOrigin}.</p>
    <p>Please ${
      url === "verify-success" ? "verify your email" : "change your Password"
    } by clicking the link below:</p>
    <a href="${verificationLink}">Link</a>
    <p>This link will expire in 24 hours.</p>
    <p>Wasnt you? Ignore this E-Mail.</p>
    <p>Thanks,</p>
    <h3>The ${clientOrigin} Team</h3>`;

  const textPart = `
    Hi there 👋

    You recently visited ${clientOrigin}.
    Please ${url === "verify-success" ? "verify your email" : "change your Password"} by clicking the link below:
    ${verificationLink}

    This link will expire in 24 hours.
    Wasnt you? Ignore this E-Mail.

    Thanks,
    The ${clientOrigin} Team`;

  console.log("sending email");

  const data = {
    Messages: [
      {
        From: {
          Email: senderEmail,
          Name: senderName,
        },
        To: [
          {
            Email: receiver,
          },
        ],
        Subject: subject,
        TextPart: textPart,
        HTMLPart: htmlPart,
      },
    ],
  };

  const request = await mailjet
    .post("send", { version: "v3.1" })
    .request(data);

  return request;
}

//render blocks smtp ports so this code not needed anymore, just keeping it for potential future usecases
/*import nodemailer from "nodemailer";
export async function sendVerificationEmail(
  receiver: string,
  url: UrlType,
  token: string,
  userId: string
) {

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });


  const mailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: receiver,
    subject: `${url === "verify-success" ? "E-Mail verification" : "Change Password"} - ${clientOrigin}`,
    html: `
      <h2>Hi there 👋</h2>
      <p>You recently visited ${clientOrigin}.</p>
      <p>Please ${url === "verify-success" ? "verify your email" : "change your Password"} by clicking the link below:</p>
      <a href="${verificationLink}">Link</a>
      <p>This link will expire in 24 hours.</p>
      <p>Wasnt you? Ignore this E-Mail.</p>
      <p>Thanks,</p>
      <h3>The ${clientOrigin} Team</h3>`,
  };

  return await transporter.sendMail(mailOptions);
}*/
