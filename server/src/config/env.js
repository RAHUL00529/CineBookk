import "dotenv/config";
import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z
      .string()
      .regex(
        /^mongodb(\+srv)?:\/\//,
        "must start with mongodb:// or mongodb+srv://",
      ),
    REDIS_URL: z
      .string()
      .regex(/^rediss?:\/\//, "must start with redis:// or rediss://"),
    CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
    JWT_SECRET: z.string().min(32, "must be at least 32 characters"),
    OTP_DEV_LOG: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
    // MAIL_HOST: z.string().optional(),
    // MAIL_PORT: z.coerce.number().int().positive().optional(),
    // MAIL_USER: z.string().optional(),
    // MAIL_PASS: z.string().optional(),
    // MAIL_FROM: z.string().optional(),
    BREVO_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().optional(), // a sender verified in Brevo, e.g. you@gmail.com
  })
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV !== "production") return;

    if (cfg.OTP_DEV_LOG) {
      ctx.addIssue({
        code: "custom",
        path: ["OTP_DEV_LOG"],
        message: "must be false in production",
      });
    }
    for (const key of ["BREVO_API_KEY", "MAIL_FROM"]) {
      if (!cfg[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "is required in production",
        });
      }
    }
  });

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  for (const issue of result.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = Object.freeze(result.data);
