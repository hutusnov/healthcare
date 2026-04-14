import axios from 'axios';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Admin APIs
export const adminAPI = {
  // Statistics
  getStatistics: () => api.get('/admin/statistics'),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Doctors
  getDoctors: (params) => api.get('/admin/doctors', { params }),
  createDoctor: (data) => api.post('/admin/doctors', data),

  // Doctor specialties (public endpoint – dùng chung cho admin)
  getSpecialties: () => api.get('/doctors/specialties'),

  // Care Profiles
  getCareProfiles: (params) => api.get('/admin/care-profiles', { params }),
  createCareProfile: (data) => api.post('/admin/care-profiles', data),

  // Doctor Slots
  getDoctorSlots: (params) => api.get('/admin/doctor-slots', { params }),
  createDoctorSlot: (data) => api.post('/admin/doctor-slots', data),

  // Appointments
  getAppointments: (params) => api.get('/admin/appointments', { params }),
  createAppointment: (data) => api.post('/admin/appointments', data),
  updateAppointmentStatus: (id, status) =>
    api.patch(`/admin/appointments/${id}/status`, { status }),
  updateAppointmentPaymentStatus: (id, paymentStatus) =>
    api.patch(`/admin/appointments/${id}/payment-status`, { paymentStatus }),
  updateAppointmentResult: (id, payload) =>
    api.patch(`/admin/appointments/${id}/result`, payload),
};

export default api;
