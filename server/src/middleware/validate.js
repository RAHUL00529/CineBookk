import { ApiError } from "../utils/ApiError.js";

// Usage: validate({ params: zodSchema, query: zodSchema, body: zodSchema })
export const validate = (schemas) => (req, _res, next) => {
  const valid = {};

  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;

    const result = schemas[part].safeParse(req[part]);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return next(new ApiError(400, "Invalid request", issues));
    }
    valid[part] = result.data;
  }

  req.valid = valid;
  next();
};
