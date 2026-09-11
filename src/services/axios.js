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

// Centralized session-expiry handling: 401 means the token itself is
// missing/invalid/expired (as opposed to 403, which means the user is
// authenticated but not permitted — that must NOT log anyone out, so it
// is deliberately left untouched here and keeps flowing to each page's
// own error handling). Login's own failed-credentials response is also a
// 401 from this same backend, but at that point there is no stored
// accessToken to clear, so `hadSession` below is false and this is a
// no-op for that case.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadSession = Boolean(localStorage.getItem("accessToken"));

      if (hadSession) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        // Matches Topbar's existing logout navigation (a full reload, not
        // a client-side route change) — guaranteed to drop all in-memory
        // app state so nothing keeps rendering as if still authenticated.
        // Guarded to only fire once per invalid session: once the token is
        // cleared, this branch is skipped for any other in-flight request
        // that also comes back 401, and the login page itself never holds
        // a stored token, so this can't loop.
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;