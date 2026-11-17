import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edupulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  me: () => api.get('/api/auth/me'),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
};

// Students
export const studentsAPI = {
  list: (params) => api.get('/api/students', { params }),
  get: (id) => api.get(`/api/students/${id}`),
  create: (data) => api.post('/api/students', data),
  delete: (id) => api.delete(`/api/students/${id}`),
};

// Prediction
export const predictAPI = {
  predict: (data) => api.post('/api/predict', data),
};

// Batch Prediction
export const batchAPI = {
  batchPredict: (formData) => api.post('/api/batch-predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Model
export const modelAPI = {
  getPerformance: () => api.get('/api/model-performance'),
  train: () => api.post('/api/train'),
};

// Interventions
export const interventionsAPI = {
  list: (params) => api.get('/api/interventions', { params }),
  create: (data) => api.post('/api/interventions', data),
  update: (id, data) => api.put(`/api/interventions/${id}`, data),
};

// Reports
export const reportAPI = {
  getReport: (studentId) => api.get(`/api/report/${studentId}`),
};

export default api;
