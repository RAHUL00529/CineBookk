// import nodemailer from "nodemailer";
// import { env } from "../config/env.js";
// import { OTP_TTL_SEC } from "../config/constants.js";

// const mailConfigured = Boolean(
//   env.MAIL_HOST &&
//   env.MAIL_PORT &&
//   env.MAIL_USER &&
//   env.MAIL_PASS &&
//   env.MAIL_FROM,
// );

// const transporter = mailConfigured
//   ? nodemailer.createTransport({
//       host: env.MAIL_HOST,
//       port: env.MAIL_PORT,
//       secure: env.MAIL_PORT === 465, // 587 uses STARTTLS, which is automatic
//       auth: { user: env.MAIL_USER, pass: env.MAIL_PASS },
//       connectionTimeout: 10_000,
//       greetingTimeout: 10_000,
//       socketTimeout: 15_000,
//     })
//   : null;

// // For debugging setup problems: connects and logs in, sends nothing
// export async function verifyMailConnection() {
//   if (!transporter) throw new Error("Mail is not configured");
//   await transporter.verify();
// }

// export async function sendOtpEmail(to, otp) {
//   if (env.OTP_DEV_LOG) {
//     console.log(`[dev] OTP for ${to}: ${otp}`);
//   }

//   if (!transporter) {
//     if (env.OTP_DEV_LOG) return; // console-only dev mode
//     throw new Error("Mail is not configured");
//   }

//   const minutes = OTP_TTL_SEC / 60;
//   await transporter.sendMail({
//     from: env.MAIL_FROM,
//     to,
//     subject: `${otp} is your CineBook login code`,
//     text:
//       `Your CineBook login code is ${otp}.\n` +
//       `It expires in ${minutes} minutes. If you did not request it, ignore this email.`,
//     html:
//       `<p>Your CineBook login code is:</p>` +
//       `<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p>` +
//       `<p>It expires in ${minutes} minutes. If you did not request it, ignore this email.</p>`,
//   });
// }
import { env } from "../config/env.js";
import { OTP_TTL_SEC } from "../config/constants.js";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const mailConfigured = Boolean(env.BREVO_API_KEY && env.MAIL_FROM);

// Same name as before, so try-mail.js keeps working
export async function verifyMailConnection() {
  if (!mailConfigured) throw new Error("Mail is not configured");
  const res = await fetch("https://api.brevo.com/v3/account", {
    headers: { "api-key": env.BREVO_API_KEY },
  });
  if (!res.ok) throw new Error(`Brevo rejected the API key (${res.status})`);
}

export async function sendOtpEmail(to, otp) {
  if (env.OTP_DEV_LOG) {
    console.log(`[dev] OTP for ${to}: ${otp}`);
  }

  if (!mailConfigured) {
    if (env.OTP_DEV_LOG) return; // console-only dev mode
    throw new Error("Mail is not configured");
  }

  const minutes = OTP_TTL_SEC / 60;
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM, name: "CineBook" },
      to: [{ email: to }],
      subject: `${otp} is your CineBook login code`,
      textContent:
        `Your CineBook login code is ${otp}.\n` +
        `It expires in ${minutes} minutes. If you did not request it, ignore this email.`,
      htmlContent:
        `<p>Your CineBook login code is:</p>` +
        `<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p>` +
        `<p>It expires in ${minutes} minutes. If you did not request it, ignore this email.</p>`,
    }),
    signal: AbortSignal.timeout(10_000), // never hang a login request
  });

  if (!res.ok) {
    // Log Brevo's reason for us; the controller shows the user a generic error
    throw new Error(`Brevo send failed (${res.status}): ${await res.text()}`);
  }
}
