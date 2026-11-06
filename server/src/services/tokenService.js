import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { SESSION_TTL_SEC } from "../config/constants.js";

export function signSession(userId) {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(userId),
    expiresIn: SESSION_TTL_SEC,
  });
}

// Returns the user id, or null for anything wrong: tampered, expired, wrong algorithm
export function verifySession(token) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
