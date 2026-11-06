import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";
import {
  OTP_TTL_SEC,
  OTP_MAX_ATTEMPTS,
  OTP_COOLDOWN_SEC,
} from "../config/constants.js";

const otpKey = (email) => `otp:${email}`;
const attemptsKey = (email) => `otp:attempts:${email}`;
const cooldownKey = (email) => `otp:cooldown:${email}`;

export const normalizeEmail = (email) => String(email).trim().toLowerCase();

// 6 digits, cryptographically random, leading zeros kept ("004821")
export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// The "otp:" prefix keeps these hashes separate from anything else
// we might ever sign with the same secret.
export function hashOtp(email, otp) {
  return createHmac("sha256", env.JWT_SECRET)
    .update(`otp:${email}:${otp}`)
    .digest("hex");
}

function safeEqualHex(a, b) {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Creates and stores a new OTP for this email.
 * Returns { ok: true, otp } or { ok: false, reason: "cooldown", retryAfterSec }.
 * The caller sends the plain otp by email and must never store or log it
 * (except the dev-only console mode).
 */
export async function createOtp(rawEmail) {
  const email = normalizeEmail(rawEmail);

  // SET ... NX only succeeds if the key does not exist: an atomic "am I allowed?"
  const allowed = await redis.set(
    cooldownKey(email),
    "1",
    "EX",
    OTP_COOLDOWN_SEC,
    "NX",
  );
  if (allowed === null) {
    const ttl = await redis.ttl(cooldownKey(email));
    return { ok: false, reason: "cooldown", retryAfterSec: Math.max(ttl, 1) };
  }

  const otp = generateOtp();
  await redis
    .multi()
    .set(otpKey(email), hashOtp(email, otp), "EX", OTP_TTL_SEC)
    .del(attemptsKey(email)) // a fresh code starts with a fresh attempt count
    .exec();

  return { ok: true, otp };
}

/**
 * Checks a submitted code.
 * Returns { ok: true } or { ok: false, reason } where reason is one of:
 * "too_many_attempts" | "expired" | "invalid"
 */
export async function verifyOtp(rawEmail, submitted) {
  const email = normalizeEmail(rawEmail);

  // Count the attempt BEFORE checking the code, so every guess is counted.
  // INCR is atomic, so parallel guesses cannot sneak past the cap.
  const [[, attempts]] = await redis
    .multi()
    .incr(attemptsKey(email))
    .expire(attemptsKey(email), OTP_TTL_SEC)
    .exec();

  if (attempts > OTP_MAX_ATTEMPTS) {
    await redis.del(otpKey(email)); // burn the code: the user must request a new one
    return { ok: false, reason: "too_many_attempts" };
  }

  const stored = await redis.get(otpKey(email));
  if (!stored) return { ok: false, reason: "expired" };

  if (!safeEqualHex(stored, hashOtp(email, String(submitted)))) {
    return { ok: false, reason: "invalid" };
  }

  // Correct code. Only the request whose DEL returns 1 actually consumed it.
  const consumed = await redis.del(otpKey(email));
  if (consumed !== 1) return { ok: false, reason: "invalid" };

  await redis.del(attemptsKey(email));
  return { ok: true };
}
// Used when the email could not be sent: lets the user retry immediately
export async function discardOtp(rawEmail) {
  const email = normalizeEmail(rawEmail);
  await redis.del(otpKey(email), cooldownKey(email));
}
