import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { me, logout } from "../controllers/auth.controller.js";
import {
  requestOtpLimiter,
  verifyOtpLimiter,
} from "../middleware/rateLimit.js";
import {
  requestOtp,
  verifyOtpHandler,
} from "../controllers/auth.controller.js";

const router = Router();

// Trim and lowercase first, then check the shape
const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

const requestBody = z.strictObject({ email });
const verifyBody = z.strictObject({
  email,
  otp: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

// The limiter runs BEFORE validation, so junk requests count too
router.post(
  "/request-otp",
  requestOtpLimiter,
  validate({ body: requestBody }),
  requestOtp,
);
router.post(
  "/verify-otp",
  verifyOtpLimiter,
  validate({ body: verifyBody }),
  verifyOtpHandler,
);
router.get("/me", requireAuth, me);
router.post("/logout", logout);

export default router;
