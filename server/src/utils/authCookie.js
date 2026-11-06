import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME, SESSION_TTL_SEC } from "../config/constants.js";

const prod = env.NODE_ENV === "production";

const options = {
  httpOnly: true,
  secure: prod,
  sameSite: "lax",
  path: "/",
};

export const setAuthCookie = (res, token) =>
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...options,
    maxAge: SESSION_TTL_SEC * 1000,
  });

export const clearAuthCookie = (res) =>
  res.clearCookie(AUTH_COOKIE_NAME, options);
