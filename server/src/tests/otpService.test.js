import { randomUUID } from "node:crypto";
import { describe, it, expect, afterEach, afterAll } from "vitest";
import { redis } from "../config/redis.js";
import { OTP_MAX_ATTEMPTS } from "../config/constants.js";
import {
  createOtp,
  verifyOtp,
  generateOtp,
  hashOtp,
} from "../services/otpService.js";

const emails = [];
const newEmail = () => {
  const email = `otp-${randomUUID()}@example.com`;
  emails.push(email);
  return email;
};
const clearCooldown = (email) => redis.del(`otp:cooldown:${email}`);
const wrongCodeFor = (otp) => (otp === "000000" ? "000001" : "000000");

afterEach(async () => {
  const keys = emails
    .splice(0)
    .flatMap((e) => [`otp:${e}`, `otp:attempts:${e}`, `otp:cooldown:${e}`]);
  if (keys.length > 0) await redis.del(...keys);
});

afterAll(() => redis.quit());

describe("generateOtp", () => {
  it("always returns exactly 6 digits", () => {
    for (let i = 0; i < 2000; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });
});

describe("createOtp", () => {
  it("stores a hash, never the plain code", async () => {
    const email = newEmail();
    const { otp } = await createOtp(email);

    const stored = await redis.get(`otp:${email}`);
    expect(stored).not.toBe(otp);
    expect(stored).toBe(hashOtp(email, otp));
    expect(await redis.ttl(`otp:${email}`)).toBeGreaterThan(0);
  });

  it("blocks a second request inside the cooldown", async () => {
    const email = newEmail();
    expect((await createOtp(email)).ok).toBe(true);

    const second = await createOtp(email);
    expect(second).toMatchObject({ ok: false, reason: "cooldown" });
    expect(second.retryAfterSec).toBeGreaterThan(0);
  });
});

describe("verifyOtp", () => {
  it("accepts the right code, and only once", async () => {
    const email = newEmail();
    const { otp } = await createOtp(email);

    expect(await verifyOtp(email, otp)).toEqual({ ok: true });
    expect(await verifyOtp(email, otp)).toMatchObject({ ok: false });
  });

  it("ignores case and spaces in the email", async () => {
    const email = newEmail();
    const { otp } = await createOtp(email);
    expect(await verifyOtp(`  ${email.toUpperCase()} `, otp)).toEqual({
      ok: true,
    });
  });

  it("rejects a wrong code without burning the real one", async () => {
    const email = newEmail();
    const { otp } = await createOtp(email);

    expect(await verifyOtp(email, wrongCodeFor(otp))).toMatchObject({
      ok: false,
      reason: "invalid",
    });
    expect(await verifyOtp(email, otp)).toEqual({ ok: true });
  });

  it("reports expired when no code exists", async () => {
    expect(await verifyOtp(newEmail(), "123456")).toMatchObject({
      ok: false,
      reason: "expired",
    });
  });

  it("locks out after too many wrong guesses, even for the right code", async () => {
    const email = newEmail();
    const { otp } = await createOtp(email);

    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
      expect((await verifyOtp(email, wrongCodeFor(otp))).reason).toBe(
        "invalid",
      );
    }
    expect(await verifyOtp(email, otp)).toMatchObject({
      ok: false,
      reason: "too_many_attempts",
    });
    // The code was burned: even trying again fails
    expect((await verifyOtp(email, otp)).ok).toBe(false);
  });

  it("a new code resets the attempt counter and replaces the old code", async () => {
    const email = newEmail();
    const first = await createOtp(email);
    for (let i = 0; i < 3; i++) await verifyOtp(email, wrongCodeFor(first.otp));

    await clearCooldown(email); // pretend 30 seconds passed
    const second = await createOtp(email);

    expect(await redis.exists(`otp:attempts:${email}`)).toBe(0);
    expect(await verifyOtp(email, second.otp)).toEqual({ ok: true });
  });

  it("single-use holds under parallel requests: exactly one wins", async () => {
    const email = newEmail();
    const { otp } = await createOtp(email);

    // Stay within the attempt cap so the cap isn't what we're measuring
    const results = await Promise.all(
      Array.from({ length: OTP_MAX_ATTEMPTS }, () => verifyOtp(email, otp)),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });
});
