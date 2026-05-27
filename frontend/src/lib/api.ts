import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// ── Auth ────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  login: (phone: string, password: string) => api.post('/auth/login', { phone, password }),
  getProfile: () => api.get('/auth/me'),
};

// ── Members ─────────────────────────────────────────────────
export const membersApi = {
  getAll: (params?: any) => api.get('/members', { params }),
  getOne: (id: string) => api.get(`/members/${id}`),
  create: (data: any) => api.post('/members', data),
  update: (id: string, data: any) => api.put(`/members/${id}`, data),
  delete: (id: string) => api.delete(`/members/${id}`),
  getStats: (id: string) => api.get(`/members/${id}/stats`),
  search: (phone: string) => api.get('/members/search', { params: { phone } }),
  assignMembership: (id: string, data: any) => api.post(`/members/${id}/membership`, data),
  regenerateQr: (id: string) => api.post(`/members/${id}/qr/regenerate`),
};

// ── Attendance ──────────────────────────────────────────────
export const attendanceApi = {
  checkInByQr: (qrCode: string) => api.post('/attendance/qr', { qrCode }),
  checkInManual: (memberId: string) => api.post('/attendance/manual', { memberId }),
  checkOut: (attendanceId: string) => api.post(`/attendance/${attendanceId}/checkout`),
  getToday: () => api.get('/attendance/today'),
  getMemberHistory: (memberId: string, days?: number) =>
    api.get(`/attendance/member/${memberId}`, { params: { days } }),
  getStats: (days?: number) => api.get('/attendance/stats', { params: { days } }),
  trainerCheckIn: () => api.post('/attendance/trainer/checkin'),
  trainerCheckOut: () => api.post('/attendance/trainer/checkout'),
};

// ── Payments ────────────────────────────────────────────────
export const paymentsApi = {
  createOrder: (data: any) => api.post('/payments/order', data),
  verifyPayment: (data: any) => api.post('/payments/verify', data),
  recordCash: (data: any) => api.post('/payments/cash', data),
  recordUpi: (data: any) => api.post('/payments/upi', data),
  getHistory: (params?: any) => api.get('/payments', { params }),
  getDailySummary: (date?: string) => api.get('/payments/daily', { params: { date } }),
  getMonthlyRevenue: (year: number, month: number) =>
    api.get('/payments/monthly', { params: { year, month } }),
  downloadReceipt: (paymentId: string) =>
    api.get(`/payments/${paymentId}/receipt`, { responseType: 'blob' }),
};

// ── Dashboard ───────────────────────────────────────────────
export const dashboardApi = {
  getOwnerDashboard: () => api.get('/dashboard/owner'),
  getBranchDashboard: () => api.get('/dashboard/branch'),
  getRevenueChart: (days?: number) => api.get('/dashboard/revenue-chart', { params: { days } }),
  getMemberGrowth: (months?: number) => api.get('/dashboard/member-growth', { params: { months } }),
};

// ── Renewals ────────────────────────────────────────────────
export const renewalsApi = {
  getExpiring: (days?: number) => api.get('/renewals/expiring', { params: { days } }),
  getExpired: (daysAgo?: number) => api.get('/renewals/expired', { params: { daysAgo } }),
  sendReminder: (memberId: string) => api.post(`/renewals/reminder/${memberId}`),
};

// ── Plans ───────────────────────────────────────────────────
export const plansApi = {
  getAll: () => api.get('/plans'),
  create: (data: any) => api.post('/plans', data),
  update: (id: string, data: any) => api.put(`/plans/${id}`, data),
  delete: (id: string) => api.delete(`/plans/${id}`),
};

// ── Trainers ────────────────────────────────────────────────
export const trainersApi = {
  getAll: () => api.get('/trainers'),
  getOne: (id: string) => api.get(`/trainers/${id}`),
  getStats: (id: string) => api.get(`/trainers/${id}/stats`),
  update: (id: string, data: any) => api.put(`/trainers/${id}`, data),
};

// ── WhatsApp ────────────────────────────────────────────────
export const whatsappApi = {
  sendBroadcast: (data: any) => api.post('/whatsapp/broadcast', data),
  sendToMember: (memberId: string, message: string) =>
    api.post('/whatsapp/send', { memberId, message }),
};
