import { http } from "./http.js";

export const requestOtp = (email) =>
  http.post("/auth/request-otp", { email }).then((res) => res.data);

export const verifyOtp = (email, otp) =>
  http.post("/auth/verify-otp", { email, otp }).then((res) => res.data.user);

export const getMe = () => http.get("/auth/me").then((res) => res.data.user);

export const logout = () => http.post("/auth/logout").then((res) => res.data);
