import axios from "axios";

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 10000,
});
