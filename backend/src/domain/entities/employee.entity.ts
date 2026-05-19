import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Department } from './department.entity';
import { Position } from './position.entity';
import { Shift } from './shift.entity';
import { Leave } from './leave.entity';
import { Tenant } from './tenant.entity';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Identité ──────────────────────────────────────────────────────────────
  @Column({ name: 'employee_number', unique: true })
  employeeNumber: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true })
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

  // ── Timestamps ────────────────────────────────────────────────────────────
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ── Getters calculés ──────────────────────────────────────────────────────
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
