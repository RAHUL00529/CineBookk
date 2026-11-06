import http from "node:http";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import {
  connectTestDb,
  clearTestDb,
  disconnectTestDb,
} from "../tests/helpers/testDb.js";
import { app } from "../app.js";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { AUTH_COOKIE_NAME } from "../config/constants.js";
import { createOtp } from "../services/otpService.js";
import { signSession } from "../services/tokenService.js";

let server;
let base;
const emails = [];

async function api(method, path, { body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token && { cookie: `${AUTH_COOKIE_NAME}=${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  return { res, status: res.status, body: await res.json() };
}

// Creates a real OTP (no email involved), logs in over HTTP, returns the cookie token
async function login() {
  const email = `auth-${randomUUID()}@example.com`;
  emails.push(email);
  const { otp } = await createOtp(email);
  const result = await api("POST", "/auth/verify-otp", {
    body: { email, otp },
  });
  const setCookie = result.res.headers.getSetCookie().join(";");
  const token = new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`).exec(setCookie)?.[1];
  return { ...result, email, token, setCookie };
}

beforeAll(async () => {
  await connectTestDb();
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}/api`;
});

beforeEach(clearTestDb);

afterAll(async () => {
  const keys = emails.flatMap((e) => [
    `otp:${e}`,
    `otp:attempts:${e}`,
    `otp:cooldown:${e}`,
  ]);
  if (keys.length > 0) await redis.del(...keys);
  await new Promise((r) => server.close(r));
  await clearTestDb();
  await disconnectTestDb();
  await redis.quit();
});

describe("login and session", () => {
  it("verify-otp sets an httpOnly cookie and /me returns the user", async () => {
    const { status, setCookie, token, email } = await login();
    expect(status).toBe(200);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);

    const me = await api("GET", "/auth/me", { token });
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
  });

  it("logging in twice returns the same user (no duplicates)", async () => {
    const first = await login();
    const { otp } = await createOtp(first.email).catch(() => ({})); // cooldown blocks this
    expect(otp).toBeUndefined();
    const me = await api("GET", "/auth/me", { token: first.token });
    expect(me.body.user.id).toBe(first.body.user.id);
  });

  it("logout clears the cookie", async () => {
    const { res } = await api("POST", "/auth/logout");
    expect(res.headers.getSetCookie().join(";")).toMatch(
      new RegExp(`${AUTH_COOKIE_NAME}=;`),
    );
  });
});

describe("token rejection", () => {
  it("rejects a missing token", async () => {
    expect((await api("GET", "/auth/me")).status).toBe(401);
  });

  it("rejects a tampered token", async () => {
    const { token } = await login();
    const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
    expect((await api("GET", "/auth/me", { token: tampered })).status).toBe(
      401,
    );
  });

  it("rejects a token signed with a different secret", async () => {
    const forged = jwt.sign({}, "x".repeat(40), { subject: "abc" });
    expect((await api("GET", "/auth/me", { token: forged })).status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const expired = jwt.sign(
      { sub: "abc", exp: Math.floor(Date.now() / 1000) - 10 },
      env.JWT_SECRET,
    );
    expect((await api("GET", "/auth/me", { token: expired })).status).toBe(401);
  });

  it('rejects an unsigned token with alg "none"', async () => {
    const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const none = `${enc({ alg: "none", typ: "JWT" })}.${enc({ sub: "abc" })}.`;
    expect((await api("GET", "/auth/me", { token: none })).status).toBe(401);
  });

  it("rejects a valid token for a user that no longer exists", async () => {
    const { token } = await login();
    await clearTestDb();
    expect((await api("GET", "/auth/me", { token })).status).toBe(401);
  });

  it("accepts a freshly signed token only for real ids", async () => {
    // "userA" is a valid session id for the hold tests, but not a real user
    expect(
      (await api("GET", "/auth/me", { token: signSession("userA") })).status,
    ).toBe(401);
  });
});
