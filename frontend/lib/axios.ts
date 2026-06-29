import axios from "axios";
import { resolveApiBaseUrl } from "./apiBaseUrl";

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
});

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/register",
  "/register/check-email",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url ?? "");
    const isSessionProbe = requestUrl.includes("/users/me");

    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      !isSessionProbe
    ) {
      const path = window.location.pathname;
      const isPublic = PUBLIC_PATH_PREFIXES.some(
        (p) => path === p || path.startsWith(`${p}/`),
      );
      if (!isPublic) {
        const next = encodeURIComponent(path);
        window.location.href = `/login?next=${next}`;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
