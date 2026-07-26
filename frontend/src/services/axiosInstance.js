import axios from "axios";
import { API_BASE_URL } from "@/config/constants";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let accessToken = null;
let refreshPromise = null; // shared in-flight refresh — see refreshSession() below

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const isRefreshEndpoint = (url = "") => url.includes("/auth/refresh-token");
const isLoginEndpoint = (url = "") => url.includes("/auth/login");

// This is the ONLY place in the app that ever calls POST /auth/refresh-token.
// Refresh tokens are single-use/rotated server-side, so if two callers each
// fired their own refresh request at nearly the same moment, the first would
// rotate the cookie and the second would present an already-revoked token —
// causing a cascading 401 loop. Sharing one in-flight promise means every
// caller (AuthContext's initial bootstrap AND the response interceptor below)
// waits on the exact same network call instead of racing separate ones.
export const refreshSession = () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axiosInstance
    .post("/auth/refresh-token")
    .then(({ data }) => {
      const token = data.data.accessToken;
      setAccessToken(token);
      return { token, user: data.data.user };
    })
    .catch((error) => {
      setAccessToken(null);
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

axiosInstance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never attempt to "refresh" when the failing call was the refresh-token
    // endpoint itself, or the login endpoint — both are expected to 401 for
    // a logged-out visitor.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshEndpoint(originalRequest.url) &&
      !isLoginEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const { token } = await refreshSession();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;