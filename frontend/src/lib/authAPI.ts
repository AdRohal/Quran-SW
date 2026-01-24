import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Don't set Content-Type for multipart/form-data - let axios handle it
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
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

  updateProfile: async (data: { name: string; email: string; bio: string; image?: File }) => {
    const formData = new FormData();
    formData.append('full_name', data.name);
    formData.append('email', data.email);
    formData.append('bio', data.bio);
    if (data.image) {
      console.log('Adding image to FormData:', data.image.name, data.image.size, 'bytes');
      formData.append('image', data.image);
    } else {
      console.log('No image file to upload');
    }

    console.log('Sending FormData with keys:', Array.from(formData.entries()).map(([k]) => k));
    const response = await api.post('/auth/update-profile', formData);
    return response.data;
  },
};

export const readingAPI = {
  recordRead: async () => {
    const response = await api.post('/reading/record-read');
    return response.data;
  },

  getStreak: async () => {
    const response = await api.get('/reading/streak');
    return response.data;
  },

  saveMemorization: async (surahNumber: number, ayahStart: number, ayahEnd: number) => {
    const response = await api.post('/reading/save-memorization', {
      surahNumber,
      ayahStart,
      ayahEnd,
    });
    return response.data;
  },

  saveSessionMemorization: async (surahNumber: number, passedAyahs: number[]) => {
    const response = await api.post('/reading/save-session-memorization', {
      surahNumber,
      passedAyahs,
    });
    return response.data;
  },

  getMoralizationProgress: async (surahNumber: number) => {
    const response = await api.get(`/reading/memorization/${surahNumber}`);
    return response.data;
  },

  getMemorizationProgress: async (surahNumber: number) => {
    const response = await api.get(`/reading/memorization/${surahNumber}`);
    return response.data;
  },

  getMemorizedSurahsCount: async () => {
    const response = await api.get(`/reading/memorized-surahs-count`);
    return response.data;
  },
};

export default api;
