import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Intercepteur Request — injecter le token & tenant ──────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const user = JSON.parse(localStorage.getItem('hrms_user') || 'null');
  if (user?.tenantId) config.headers['X-Tenant-ID'] = user.tenantId;

  return config;
});

// ── Intercepteur Response — gérer les erreurs globalement ─────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ── Services API spécialisés ───────────────────────────────────────────────
export const employeeApi = {
  getAll: (params?: any) => apiClient.get('/employees', { params }),
  getById: (id: string) => apiClient.get(`/employees/${id}`),
  create: (data: any) => apiClient.post('/employees', data),
  update: (id: string, data: any) => apiClient.put(`/employees/${id}`, data),
  delete: (id: string) => apiClient.delete(`/employees/${id}`),
  onboard: (id: string) => apiClient.patch(`/employees/${id}/onboard`),
  offboard: (id: string, data: any) => apiClient.patch(`/employees/${id}/offboard`, data),
};

export const shiftApi = {
  getAll: (params?: any) => apiClient.get('/shifts', { params }),
  create: (data: any) => apiClient.post('/shifts', data),
  update: (id: string, data: any) => apiClient.put(`/shifts/${id}`, data),
  delete: (id: string) => apiClient.delete(`/shifts/${id}`),
  clockIn: (data: any) => apiClient.post('/shifts/clock-in', data),
  clockOut: (data: any) => apiClient.post('/shifts/clock-out', data),
  getQrCode: () => apiClient.get('/shifts/qr-code'),
  startBreak: (id: string) => apiClient.post(`/shifts/${id}/start-break`),
  endBreak: (id: string) => apiClient.post(`/shifts/${id}/end-break`),
  publish: (startDate: string, endDate: string) => apiClient.post('/shifts/publish', { startDate, endDate }),
};

export const leaveApi = {
  getAll: (params?: any) => apiClient.get('/leaves', { params }),
  getByEmployee: (employeeId: string) => apiClient.get(`/leaves/employee/${employeeId}`),
  create: (data: any) => apiClient.post('/leaves', data),
  approve: (id: string) => apiClient.patch(`/leaves/${id}/approve`),
  reject: (id: string, data: any) => apiClient.patch(`/leaves/${id}/reject`, data),
  cancel: (id: string) => apiClient.patch(`/leaves/${id}/cancel`),
};

export const payrollApi = {
  getAll: (params?: any) => apiClient.get('/payroll', { params }),
  generate: (data: any) => apiClient.post('/payroll/generate', data),
  approve: (id: string) => apiClient.patch(`/payroll/${id}/approve`),
  export: (id: string, format: 'nethris' | 'adp' | 'pdf') => apiClient.get(`/payroll/${id}/export/${format}`, { responseType: 'blob' }),
};

export const recruitmentApi = {
  getPostings: (params?: any) => apiClient.get('/recruitment/postings', { params }),
  createPosting: (data: any) => apiClient.post('/recruitment/postings', data),
  getApplications: (postingId: string) => apiClient.get(`/recruitment/postings/${postingId}/applications`),
  updateApplication: (id: string, data: any) => apiClient.patch(`/recruitment/applications/${id}`, data),
};

export const analyticsApi = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getHeadcount: (params?: any) => apiClient.get('/analytics/headcount', { params }),
  getPayrollCosts: (params?: any) => apiClient.get('/analytics/payroll-costs', { params }),
  getTurnover: (params?: any) => apiClient.get('/analytics/turnover', { params }),
  exportReport: (type: string, format: 'pdf' | 'excel') => apiClient.get(`/analytics/export/${type}`, { params: { format }, responseType: 'blob' }),
};

