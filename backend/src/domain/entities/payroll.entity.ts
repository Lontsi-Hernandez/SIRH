import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Tenant } from './tenant.entity';

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  ERROR = 'ERROR',
}

@Entity('payrolls')
export class Payroll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  // ── Heures ────────────────────────────────────────────────────────────────
  @Column({ name: 'regular_hours', type: 'decimal', precision: 8, scale: 2, default: 0 })
  regularHours: number;

  @Column({ name: 'overtime_hours', type: 'decimal', precision: 8, scale: 2, default: 0 })
  overtimeHours: number;

  @Column({ name: 'holiday_hours', type: 'decimal', precision: 8, scale: 2, default: 0 })
  holidayHours: number;

  // ── Salaire brut ──────────────────────────────────────────────────────────
  @Column({ name: 'regular_pay', type: 'decimal', precision: 12, scale: 2, default: 0 })
  regularPay: number;

  @Column({ name: 'overtime_pay', type: 'decimal', precision: 12, scale: 2, default: 0 })
  overtimePay: number;

  @Column({ name: 'bonus', type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonus: number;

  @Column({ name: 'gross_pay', type: 'decimal', precision: 12, scale: 2 })
  grossPay: number;

  // ── Déductions (Conformité québécoise) ────────────────────────────────────
  @Column({ name: 'federal_tax', type: 'decimal', precision: 12, scale: 2, default: 0 })
  federalTax: number;

  @Column({ name: 'provincial_tax', type: 'decimal', precision: 12, scale: 2, default: 0 })
  provincialTax: number;

  @Column({ name: 'ei_employee', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'Assurance-emploi employé' })
  eiEmployee: number;

  @Column({ name: 'ei_employer', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'Assurance-emploi employeur' })
  eiEmployer: number;

  @Column({ name: 'cpp_employee', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'RRQ employé' })
  cppEmployee: number;

  @Column({ name: 'cpp_employer', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'RRQ employeur' })
  cppEmployer: number;

  @Column({ name: 'rqap_employee', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'RQAP employé (QC)' })
  rqapEmployee: number;

  @Column({ name: 'rqap_employer', type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'RQAP employeur (QC)' })
  rqapEmployer: number;

  @Column({ name: 'other_deductions', type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherDeductions: number;

  @Column({ name: 'total_deductions', type: 'decimal', precision: 12, scale: 2 })
  totalDeductions: number;

  // ── Salaire net ───────────────────────────────────────────────────────────
  @Column({ name: 'net_pay', type: 'decimal', precision: 12, scale: 2 })
  netPay: number;

  // ── Statut & Export ───────────────────────────────────────────────────────
  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Column({ name: 'nethris_export_id', nullable: true })
  nethrisExportId?: string;

  @Column({ name: 'exported_at', type: 'timestamptz', nullable: true })
  exportedAt?: Date;

  @Column({ name: 'pay_stub_url', nullable: true })
  payStubUrl?: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
