import axios from 'axios';

const api = axios.create({
  baseURL: 'https://personal-finance-tracker-eo0x.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — extract error messages cleanly
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
