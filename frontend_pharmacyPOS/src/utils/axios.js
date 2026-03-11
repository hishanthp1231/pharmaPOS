import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include the token and branch_id
api.interceptors.request.use(
  (config) => {
    // Log all outgoing requests for debugging
    console.log('Axios request:', config.method, config.url, config.data || config.params);

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle FormData - remove Content-Type to let browser set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Get logged-in user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user?.role_id && (user?.is_admin === true || user?.is_admin === 1);

    // Always get branch_id from localStorage for every request
    let branch_id = localStorage.getItem('branch_id');
    // If not set, default to 1 and update localStorage
    if (!branch_id) {
      branch_id = '1';
      localStorage.setItem('branch_id', branch_id);
    }

    const url = config.url || '';
    // Only skip branch_id for /branches, /store, /workers, /user-management/users, /billing-settings, /profile endpoints
    const skipBranch = /\/(branches|store|workers|user-management\/users|billing-settings|profile)(\/|$)/.test(url);

    // Debug: log branch_id and skipBranch
    console.log('[AXIOS DEBUG] branch_id:', branch_id, 'skipBranch:', skipBranch, 'url:', url);

    if (branch_id && !skipBranch) {
      // Debug: log current branch id and how it's sent
      if (['get', 'delete'].includes(config.method)) {
        if (!config.params || typeof config.params !== 'object') {
          config.params = {};
        }
        if (!config.params.branch_id) {
          config.params.branch_id = branch_id;
        }
      } else if (['post', 'put', 'patch'].includes(config.method)) {
        if (config.data instanceof FormData) {
          if (!config.data.has('branch_id')) {
            config.data.set('branch_id', branch_id);
          }
        } else {
          let data = config.data;
          if (!data || typeof data !== 'object') {
            data = {};
          }
          if (!data.branch_id) {
            data.branch_id = branch_id;
            config.data = data;
          }
        }
      }
    } else {
      if (!branch_id) {
        console.log('[AXIOS DEBUG] branch_id not set in localStorage');
      }
      if (skipBranch) {
        console.log(`[AXIOS DEBUG] Skipping branch_id for ${config.url}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage && errorMessage.includes('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
// No changes needed here if you follow the above fix.
