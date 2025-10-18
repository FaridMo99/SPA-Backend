import nodemailer from "nodemailer";

type UrlType = "verify-success" | "change-password";

export async function sendVerificationEmail(
  receiver: string,
  url: UrlType,
  token: string,
  userId: string
) {
  const clientOrigin = process.env.CLIENT_ORIGIN;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const verificationLink = `${clientOrigin}/${url}?token=${token}&userId=${userId}`;

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
}