import { AUTH_COOKIE_NAME } from "../config/constants.js";
import { ApiError } from "../utils/ApiError.js";
import { verifySession } from "../services/tokenService.js";

// Letters, digits, _ and - only. A ":" here could fake the "mine" check in getSnapshot.
// const SAFE_ID = /^[A-Za-z0-9_-]{1,40}$/;
export const SAFE_ID = /^[A-Za-z0-9_-]{1,40}$/;

export function requireAuth(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  const id = token ? verifySession(token) : null;

  if (!id || !SAFE_ID.test(id)) {
    return next(new ApiError(401, "Login required"));
  }

  req.user = { id };
  next();
}
