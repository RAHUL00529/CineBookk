export const MAX_SEATS = 6; // keep in sync with client/src/constants.js

export const HOLD_TTL_MS = 5 * 60 * 1000; // the payment deadline

export const HOLD_GRACE_MS = 60 * 1000; // hold record outlives its locks slightly
export const OTP_TTL_SEC = 5 * 60; // how long a code is valid
export const OTP_MAX_ATTEMPTS = 5; // wrong guesses allowed per code
export const OTP_COOLDOWN_SEC = 30; // minimum gap between requests per email
export const AUTH_COOKIE_NAME = "token";
export const SESSION_TTL_SEC = 7 * 24 * 60 * 60; // 7 days
