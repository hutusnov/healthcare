import axios from 'axios';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL.replace(/\/$/, '')}/api`;
const OCR_URL = import.meta.env.VITE_OCR_URL || 'http://localhost:8000';

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
    register: (data) => api.post('/auth/register', data),
    forgotPassword: (email) => api.post('/auth/forgot', { email }),
    resetPassword: (data) => api.post('/auth/reset', data),
    getCurrentUser: () => api.get('/users/me'),
};

// Patient APIs
export const patientAPI = {
    getProfile: () => api.get('/patient/profile'),
    updateProfile: (data) => api.post('/patient/profile', data),
    getAppointments: () => api.get('/patient/appointments'),
    getAppointmentResults: () => api.get('/patient/appointments/results'),
};

// Doctor APIs
export const doctorAPI = {
    getAll: (params) => api.get('/doctors', { params }),
    getById: (id) => api.get(`/doctors/${id}`),
    getSpecialties: () => api.get('/doctors/specialties'),
    getAvailable: (params) => api.get('/doctors/available', { params }),
};

export const publicAPI = {
    getHomeStats: () => api.get('/public/stats'),
};

// Appointment APIs
export const appointmentAPI = {
    getAvailableSlots: (doctorId, date) =>
        api.get('/appointments/available', { params: date ? { doctorId, day: date } : { doctorId } }),
    book: (data) => api.post('/appointments/book', data),
    cancel: (id, reason) => api.post(`/appointments/${id}/cancel`, reason ? { reason } : {}),
    getCalendar: (params) => api.get('/appointments/calendar', { params }),
};

// Care Profile APIs
export const careProfileAPI = {
    getAll: () => api.get('/care-profiles'),
    create: (data) => api.post('/care-profiles', data),
    update: (id, data) => api.put(`/care-profiles/${id}`, data),
    delete: (id) => api.delete(`/care-profiles/${id}`),
};

// Payment APIs
export const paymentAPI = {
    createMomoPayment: (appointmentId) =>
        api.post('/payments/momo/create', { appointmentId }),
    getReceipt: (appointmentId) =>
        api.get(`/payments/receipt/${appointmentId}`),
};

// Notification APIs
export const notificationAPI = {
    getAll: () => api.get('/notifications'),
};

// Location APIs
export const locationAPI = {
    getProvinces: () => api.get('/locations/provinces'),
    getDistricts: (provinceCode) =>
        api.get('/locations/districts', { params: { provinceCode } }),
    getWards: (districtCode) =>
        api.get('/locations/wards', { params: { districtCode } }),
};

// OCR APIs
export const ocrAPI = {
    scanPrescription: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const apiKey = import.meta.env.VITE_OCR_API_KEY || '';
        const response = await axios.post(`${OCR_URL}/ocr-cccd`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(apiKey && { 'X-API-Key': apiKey }),
            },
        });
        return response;
    },
    scanDocument: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const apiKey = import.meta.env.VITE_OCR_API_KEY || '';
        const response = await axios.post(`${OCR_URL}/ocr-cccd`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...(apiKey && { 'X-API-Key': apiKey }),
            },
        });
        return response;
    },
};

export default api;
