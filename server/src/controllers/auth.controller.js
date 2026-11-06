import mongoose from "mongoose";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { createOtp, verifyOtp, discardOtp } from "../services/otpService.js";
import { sendOtpEmail } from "../services/mailService.js";
import { signSession } from "../services/tokenService.js";
import { setAuthCookie, clearAuthCookie } from "../utils/authCookie.js";

export async function requestOtp(req, res) {
  const { email } = req.valid.body;

  const result = await createOtp(email);
  if (!result.ok) {
    res.set("Retry-After", String(result.retryAfterSec));
    throw new ApiError(
      429,
      `Please wait ${result.retryAfterSec}s before requesting another code`,
      { retryAfterSec: result.retryAfterSec },
    );
  }

  try {
    await sendOtpEmail(email, result.otp);
  } catch (err) {
    console.error("Failed to send OTP email:", err.message);
    await discardOtp(email); // roll back so the user can retry right away
    throw new ApiError(503, "Could not send the code. Please try again.");
  }

  res.json({ message: "A login code has been sent to your email" });
}

export async function verifyOtpHandler(req, res) {
  const { email, otp } = req.valid.body;

  const result = await verifyOtp(email, otp);
  if (!result.ok) {
    if (result.reason === "too_many_attempts") {
      throw new ApiError(429, "Too many wrong attempts. Request a new code.");
    }
    // "invalid" and "expired" deliberately look the same to the client
    throw new ApiError(400, "Incorrect or expired code");
  }

  // Atomic find-or-create: safe even if two verifies race
  const user = await User.findOneAndUpdate(
    { email },
    { $setOnInsert: { email } },
    { upsert: true, returnDocument: "after" },
  ).lean();

  setAuthCookie(res, signSession(user._id));
  //   res.json({
  //     user: { id: String(user._id), email: user.email, name: user.name },
  //   });
  res.json({ user: publicUser(user) });
}

const publicUser = (u) => ({ id: String(u._id), email: u.email, name: u.name });

export async function me(req, res) {
  const user = mongoose.isValidObjectId(req.user.id)
    ? await User.findById(req.user.id).lean()
    : null;

  if (!user) {
    clearAuthCookie(res); // a valid token for a deleted user is useless
    throw new ApiError(401, "Login required");
  }
  res.json({ user: publicUser(user) });
}

export function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
}
