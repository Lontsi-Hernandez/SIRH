import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Department } from './department.entity';
import { Position } from './position.entity';
import { Shift } from './shift.entity';
import { Leave } from './leave.entity';
import { Tenant } from './tenant.entity';

export enum EmployeeStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  ARCHIVED = 'ARCHIVED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

@Entity('employees')
@Index('idx_employees_tenant_email', ['tenantId', 'email'], { unique: true })
@Index('idx_employees_tenant_number', ['tenantId', 'employeeNumber'], { unique: true })
@Index('idx_employees_tenant_status', ['tenantId', 'status'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Identité ──────────────────────────────────────────────────────────────
  @Column({ name: 'employee_number' })
  employeeNumber: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column()
  email: string;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ name: 'sin_number', nullable: true, select: false }) // SIN (NAS) — sélection explicite requise
  sinNumber?: string;

  // ── Adresse ───────────────────────────────────────────────────────────────
  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  province?: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode?: string;

  // ── Emploi ────────────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
  })
  status: EmployeeStatus;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate: Date;

  @Column({ name: 'termination_date', type: 'date', nullable: true })
  terminationDate?: Date;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Column({ name: 'annual_salary', type: 'decimal', precision: 12, scale: 2, nullable: true })
  annualSalary?: number;

  @Column({ name: 'vacation_days_per_year', default: 15 })
  vacationDaysPerYear: number;

  @Column({ name: 'sick_days_per_year', default: 5 })
  sickDaysPerYear: number;

  // ── Keycloak ──────────────────────────────────────────────────────────────
  @Column({ name: 'keycloak_id', nullable: true, unique: true })
  keycloakId?: string;

  // ── Attributs Dynamiques ──────────────────────────────────────────────────
  @Column({ name: 'custom_attributes', type: 'jsonb', default: {} })
  customAttributes: Record<string, any>;

  // ── Relations ─────────────────────────────────────────────────────────────
  @ManyToOne(() => Department, { nullable: true, eager: false })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId?: string;

  @ManyToOne(() => Position, { nullable: true, eager: false })
  @JoinColumn({ name: 'position_id' })
  position?: Position;

  @Column({ name: 'position_id', nullable: true })
  positionId?: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @Column({ name: 'manager_id', nullable: true })
  managerId?: string;

  @OneToMany(() => Employee, (employee) => employee.manager)
  subordinates?: Employee[];

  @OneToMany(() => Shift, (shift) => shift.employee)
  shifts?: Shift[];

  @OneToMany(() => Leave, (leave) => leave.employee)
  leaves?: Leave[];

  // ── Multi-tenant ──────────────────────────────────────────────────────────
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  // ── Timestamps & Audit ────────────────────────────────────────────────────
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  // ── Getters calculés ──────────────────────────────────────────────────────
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

