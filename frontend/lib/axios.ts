import axios from "axios";
import { resolveApiBaseUrl } from "./apiBaseUrl";
import { useLoadingStore } from "@/store/loadingStore";

let uploadRequests = 0;

const api = axios.create({
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.baseURL = resolveApiBaseUrl();
  
  if (config.data instanceof FormData) {
    (config as any)._isUpload = true;
    uploadRequests++;
    useLoadingStore.getState().setUploading(true);
  }
  
  return config;
});

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/checkout",
];

api.interceptors.response.use(
  (response) => {
    if ((response.config as any)?._isUpload) {
      uploadRequests = Math.max(0, uploadRequests - 1);
      if (uploadRequests === 0) useLoadingStore.getState().setUploading(false);
    }
    return response;
  },
  (error) => {
    if ((error.config as any)?._isUpload) {
      uploadRequests = Math.max(0, uploadRequests - 1);
      if (uploadRequests === 0) useLoadingStore.getState().setUploading(false);
    }

    const requestUrl = String(error.config?.url ?? "");
    const isSessionProbe = requestUrl.includes("/users/me");

    if (error.response?.status === 429) {
      if (!error.response.data) error.response.data = {};
      // Customize message if it's the generic one or missing
      if (!error.response.data.message || error.response.data.message === "Too Many Requests") {
        error.response.data.message = "You are doing this too often. Please wait a moment and try again.";
      }
    }

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
