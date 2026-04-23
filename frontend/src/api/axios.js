import axios from 'axios';

/**
 * Single configured axios instance used everywhere.
 *
 * Why a shared instance?
 * - Base URL defined once — change backend URL in one place
 * - Request interceptor auto-attaches JWT to every call
 * - Response interceptor handles 401s globally (token expired)
 */
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired tokens globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const res = await axios.post(
          'http://127.0.0.1:8000/api/users/token/refresh/',
          { refresh }
        );
        const newAccess = res.data.access;
        localStorage.setItem('access_token', newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);   // Retry the original request
      } catch {
        // Refresh failed — clear storage and redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;