import axios from "axios";

const isLocalFrontend =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Railway is the active production backend (used on Vercel).
// EC2 backend (kept for future use, not currently active):
// "https://44-205-140-200.sslip.io"
const api = axios.create({
  baseURL: isLocalFrontend
    ? "http://localhost:3000"
    : "https://sk-learnings-backend-production-4b04.up.railway.app/",

  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        "accessToken"
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;