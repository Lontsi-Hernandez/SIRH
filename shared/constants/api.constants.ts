// ─── Constantes API partagées ─────────────────────────────────────────────────
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  PROFILE: '/auth/profile',

  // Employees
  EMPLOYEES: '/employees',
  EMPLOYEE: (id: string) => `/employees/${id}`,
  EMPLOYEE_ONBOARD: (id: string) => `/employees/${id}/onboard`,
  EMPLOYEE_OFFBOARD: (id: string) => `/employees/${id}/offboard`,
  ORG_CHART: (id: string) => `/employees/${id}/org-chart`,

  // Departments
  DEPARTMENTS: '/departments',
  DEPARTMENT: (id: string) => `/departments/${id}`,

  // Shifts
  SHIFTS: '/shifts',
  SHIFT: (id: string) => `/shifts/${id}`,
  SHIFT_CLOCK_IN: (id: string) => `/shifts/${id}/clock-in`,
  SHIFT_CLOCK_OUT: (id: string) => `/shifts/${id}/clock-out`,

  // Leaves
  LEAVES: '/leaves',
  LEAVE: (id: string) => `/leaves/${id}`,
  LEAVE_APPROVE: (id: string) => `/leaves/${id}/approve`,
  LEAVE_REJECT: (id: string) => `/leaves/${id}/reject`,

  // Payroll
  PAYROLL: '/payroll',
  PAYROLL_GENERATE: '/payroll/generate',
  PAYROLL_ITEM: (id: string) => `/payroll/${id}`,
  PAYROLL_EXPORT: (id: string, format: string) => `/payroll/${id}/export/${format}`,

  // Recruitment
  JOB_POSTINGS: '/recruitment/postings',
  JOB_POSTING: (id: string) => `/recruitment/postings/${id}`,
  JOB_APPLICATIONS: (postingId: string) => `/recruitment/postings/${postingId}/applications`,

  // Analytics
  ANALYTICS_DASHBOARD: '/analytics/dashboard',
  ANALYTICS_HEADCOUNT: '/analytics/headcount',
  ANALYTICS_PAYROLL_COSTS: '/analytics/payroll-costs',
  ANALYTICS_TURNOVER: '/analytics/turnover',
} as const;

export const ROLES_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  HR: 'Ressources humaines',
  MANAGER: 'Gestionnaire',
  EMPLOYEE: 'Employé',
};

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Vacances',
  SICK: 'Maladie',
  PERSONAL: 'Personnel',
  MATERNITY: 'Congé maternité',
  PATERNITY: 'Congé paternité',
  PARENTAL: 'Congé parental (RQAP)',
  BEREAVEMENT: 'Deuil',
  UNPAID: 'Sans solde',
  JURY_DUTY: 'Devoir de jury',
  COMPASSIONATE: 'Compassion',
};

export const SHIFT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Planifié',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  ABSENT: 'Absent',
  CANCELLED: 'Annulé',
};

// Taux légaux Québec 2024 (approximatifs — à mettre à jour annuellement)
export const QC_TAX_RATES = {
  FEDERAL_BASIC_EXEMPTION: 15705,
  PROVINCIAL_BASIC_EXEMPTION: 17183,
  EI_RATE_EMPLOYEE: 0.0166,         // 1.66%
  EI_RATE_EMPLOYER: 0.0232,         // 2.32% (ratio 1.4x)
  CPP_RATE: 0.0595,                  // 5.95% (RRQ)
  RQAP_RATE_EMPLOYEE: 0.00494,      // 0.494%
  RQAP_RATE_EMPLOYER: 0.00692,      // 0.692%
  OVERTIME_THRESHOLD_HOURS: 40,     // Heures standard/semaine
  OVERTIME_MULTIPLIER: 1.5,         // 1.5x
} as const;
