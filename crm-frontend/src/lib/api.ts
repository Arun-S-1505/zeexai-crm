import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_CRM_API_URL || '/api',
  withCredentials: true,
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor to attach bearer token
api.interceptors.request.use((config) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor to auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    // Do NOT intercept or loop on auth endpoints (login, refresh, logout, me)
    if (
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout') ||
      url.includes('/auth/me')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(
          `${import.meta.env.VITE_CRM_API_URL || '/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (refreshRes.data.success && refreshRes.data.accessToken) {
          setAccessToken(refreshRes.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${refreshRes.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        setAccessToken(null);
        // Only redirect if not already on the login page
        if (!window.location.pathname.includes('/login')) {
          const base = window.location.pathname.startsWith('/crm') ? '/crm' : '';
          window.location.pathname = `${base}/login`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

