import { ApiError } from "../utils/ApiError.js";

// Express recognises an error handler by its four arguments. Keep all four.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({
        error: err.message,
        ...(err.details && { details: err.details }),
      });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON body" });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: "Conflict: already exists" });
  }

  // Unknown bug: log the details for ourselves, show the client nothing sensitive
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
