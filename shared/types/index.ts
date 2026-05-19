// ─────────────────────────────────────────────────────────────────────────────
// HRMS — Types TypeScript partagés (frontend ↔ mobile)
// ─────────────────────────────────────────────────────────────────────────────

// ── Rôles & Statuts ───────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'BEREAVEMENT' | 'UNPAID' | 'PARENTAL' | 'JURY_DUTY' | 'COMPASSIONATE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'CANCELLED';
export type RecruitmentStatus = 'OPEN' | 'IN_REVIEW' | 'INTERVIEWING' | 'OFFER_SENT' | 'HIRED' | 'CLOSED';
export type ApplicationStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'ASSESSMENT' | 'OFFER' | 'HIRED' | 'REJECTED';
export type NotificationType = 'SHIFT_CHANGE' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'PAYROLL_READY' | 'ANNOUNCEMENT' | 'TASK_ASSIGNED' | 'REVIEW_DUE' | 'DOCUMENT_SHARED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY' | 'INTERNSHIP';

// ── Entités ──────────────────────────────────────────────────────────────────
export interface IEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status: EmployeeStatus;
  role: UserRole;
  hireDate: string;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  hourlyRate?: number;
  annualSalary?: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDepartment {
  id: string;
  name: string;
  description?: string;
  code?: string;
  managerId?: string;
  parentDepartmentId?: string;
  tenantId: string;
}

export interface IPosition {
  id: string;
  title: string;
  description?: string;
  minSalary?: number;
  maxSalary?: number;
  departmentId?: string;
  tenantId: string;
}

export interface IShift {
  id: string;
  startTime: string;
  endTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: ShiftStatus;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
  isOvertime: boolean;
  breakDurationMinutes: number;
  employeeId: string;
  tenantId: string;
  createdAt: string;
}

export interface ILeave {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedById?: string;
  employeeId: string;
  tenantId: string;
  createdAt: string;
}

export interface IPayroll {
  id: string;
  periodStart: string;
  periodEnd: string;
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  federalTax: number;
  provincialTax: number;
  eiEmployee: number;
  cppEmployee: number;
  rqapEmployee: number;
  totalDeductions: number;
  netPay: number;
  status: 'DRAFT' | 'PROCESSING' | 'APPROVED' | 'PAID' | 'ERROR';
  employeeId: string;
  tenantId: string;
  createdAt: string;
}

export interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  recipientId: string;
  senderId?: string;
  tenantId: string;
  createdAt: string;
}

export interface ITenant {
  id: string;
  slug: string;
  name: string;
  industry?: string;
  logo?: string;
  province: string;
  isActive: boolean;
  subscriptionPlan: string;
}

// ── Réponses API génériques ──────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
