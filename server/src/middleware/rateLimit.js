import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const make = (limit) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8", // sends RateLimit headers so clients can back off
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test", // tests share one IP and would hit the cap
    // Use our error format instead of the library's plain-text default
    handler: (_req, _res, next) =>
      next(new ApiError(429, "Too many requests. Please try again later.")),
  });

export const requestOtpLimiter = make(10); // 10 code requests per IP per 15 min
export const verifyOtpLimiter = make(20); // 20 verify attempts per IP per 15 min
