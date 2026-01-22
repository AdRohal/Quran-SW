import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: async (email, password, fullName) => {
    const response = await api.post('/auth/signup', {
      email,
      password,
      fullName,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default api;
